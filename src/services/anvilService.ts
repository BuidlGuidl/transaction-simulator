import { exec, spawn, ChildProcess } from 'child_process';
import { createPublicClient, http } from 'viem';
import { Transaction } from '../types';
import { RPC_URLS } from '../config';

const ANVIL_PORT = 8545;
const MAX_RETRIES = 1;
const RETRY_DELAY = 1000; // 1 second

export class AnvilService {
  private process: ChildProcess | null = null;
  private rpcUrl: string;

  constructor() {
    this.rpcUrl = `http://localhost:${ANVIL_PORT}`;
  }

  async start(chainId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      exec('anvil --version', async (error) => {
        if (error) {
          reject(new Error('Anvil is not installed. Please install Foundry.'));
          return;
        }

        let attempts = 0;
        let lastError: Error | null = null;

        while (attempts < MAX_RETRIES) {
          try {
            const rpcUrl = await this.getRpcUrl(chainId);
            
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
              '--no-mining',
            //   '--silent' // Reduce noise in test output
            ]);

          this.process.stdout?.on('data', (data) => {
            if (data.toString().includes('Listening on')) {
              resolve();
            }
          });

          this.process.stderr?.on('data', (data) => {
            console.error(`Anvil Error: ${data}`);
          });

            return; // Success, exit the retry loop
          } catch (error) {
            lastError = error as Error;
            attempts++;
            if (attempts < MAX_RETRIES) {
              await new Promise(r => setTimeout(r, RETRY_DELAY * attempts));
            }
          }
        }

        reject(new Error(`Failed to start Anvil after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`));
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

  async executeTransactions(transactions: Transaction[]): Promise<any[]> {
    const client = createPublicClient({
      transport: http(this.rpcUrl)
    });

    const results = [];
    const pendingHashes = [];

    for (const tx of transactions) {
      try {
        await client.transport.request({
          method: 'anvil_impersonateAccount',
          params: [tx.from]
        });

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

        await client.transport.request({
          method: 'anvil_stopImpersonatingAccount',
          params: [tx.from]
        });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        pendingHashes.push(null);
      }
    }

    await client.transport.request({
      method: 'evm_mine'
    });

    for (let i = 0; i < pendingHashes.length; i++) {
      const hash = pendingHashes[i];
      if (hash) {
        try {
          const receipt = await client.waitForTransactionReceipt({ hash: hash as `0x${string}` });
          results.push({
            success: true,
            hash: receipt.transactionHash,
            gasUsed: receipt.gasUsed
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return results;
  }

  private async getRpcUrl(chainId: number): Promise<string> {
    const rpcUrl = RPC_URLS[chainId];
    if (!rpcUrl) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return rpcUrl;
  }
} 