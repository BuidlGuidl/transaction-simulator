import { exec, spawn, ChildProcess } from 'child_process';
import { createPublicClient, http } from 'viem';
import { Transaction, TransactionResult } from '../types';
import { parseAnvilError } from '../utils/errorParser';

const ANVIL_PORT = 8545;

export class AnvilService {
  private process: ChildProcess | null = null;
  private rpcUrl: string;

  constructor() {
    this.rpcUrl = `http://localhost:${ANVIL_PORT}`;
  }

  async start(rpcUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      exec('anvil --version', async (error) => {
        if (error) {
          reject(new Error('Anvil is not installed. Please install Foundry.'));
          return;
        }

        try {
          // Test the RPC connection before starting anvil
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_blockNumber',
              params: []
            })
          });

          if (!response.ok) {
            throw new Error(`RPC endpoint returned ${response.status}`);
          }

          this.process = spawn('anvil', [
            '--fork-url', rpcUrl,
            '--port', ANVIL_PORT.toString(),
            '--no-mining'
          ]);

          this.process.stdout?.on('data', (data) => {
            if (data.toString().includes('Listening on')) {
              resolve();
            }
          });

          this.process.stderr?.on('data', (data) => {
            console.error(`Anvil Error: ${data}`);
          });

        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      return new Promise<void>((resolve) => {
        console.log('Stopping Anvil...');
        
        // Set up timeout to force kill if graceful shutdown takes too long
        const forceKillTimeout = setTimeout(() => {
          console.log('Force killing Anvil process...');
          if (this.process) {
            this.process.kill('SIGKILL');
          }
        }, 5000); // 5 seconds timeout

        // Listen for process exit
        this.process!.on('exit', () => {
          clearTimeout(forceKillTimeout);
          console.log('Anvil stopped successfully');
          this.process = null;
          resolve();
        });

        // Try graceful shutdown first
        this.process!.kill('SIGTERM');
      });
    }
  }

  async executeTransactions(transactions: Transaction[]): Promise<TransactionResult[]> {
    const client = createPublicClient({
      transport: http(this.rpcUrl)
    });

    const results = [];
    const pendingHashes = [];

    for (const tx of transactions) {
       // Impersonate sender
      await client.transport.request({
        method: 'anvil_impersonateAccount',
        params: [tx.from]
      });
      try {
        const hash = await client.transport.request({
          method: 'eth_sendTransaction',
          params: [{
            from: tx.from,
            to: tx.to,
            data: tx.data || '0x',
            value: tx.value ? `0x${BigInt(tx.value).toString(16)}` : undefined,
            gas: tx.gasLimit ? `0x${BigInt(tx.gasLimit).toString(16)}` : undefined,
          }]
        }) as `0x${string}`;

        pendingHashes.push(hash);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? parseAnvilError(error) : 'Unknown error'
        });
        pendingHashes.push(null);
      }
      // Mine a block between each transaction to ensure the state is updated
      await client.transport.request({
        method: 'evm_mine'
      });
    }

    const receiptPromises = pendingHashes
      .filter(hash => hash)
      .map(async (hash) => {
        try {
          const receipt = await client.waitForTransactionReceipt({ hash: hash as `0x${string}` });
          return {
            success: true,
            hash: receipt.transactionHash,
            gasUsed: receipt.gasUsed
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? parseAnvilError(error) : 'Unknown error'
          };
        }
      });

    const resultsToAdd = await Promise.all(receiptPromises);
    results.push(...resultsToAdd);

    return results;
  }
} 