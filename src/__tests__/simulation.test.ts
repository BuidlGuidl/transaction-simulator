import { describe, it, expect } from 'vitest';
import dotenv from 'dotenv';
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
 
dotenv.config();

const RPC_URL = process.env.RPC_URL_ETHEREUM || 'https://eth.llamarpc.com';

describe('Simulation API', () => {
  const port = 3001;
  const baseUrl = `http://localhost:${port}`;


  it('should simulate a simple ETH transfer', async () => {
    const walletClient = createWalletClient({
      account: privateKeyToAccount(generatePrivateKey()),
      chain: mainnet,
      transport: http(RPC_URL),
    })
    const [address] = await walletClient.getAddresses();
    const response = await fetch(`${baseUrl}/api/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rpcUrl: RPC_URL,
        transactions: [
          {
            from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // vitalik.eth
            to: address, 
            value: '1000000000000000000', // 1 ETH
          }
        ],
        expect: []
      })
    });

    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result).toMatchObject({
      success: true,
      results: {
        transactions: [
          {
            success: true,
            hash: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
            gasUsed: expect.any(String)
          }
        ]
      }
    });
  });

  it('should simulate a contract call', async () => {
    const response = await fetch(`${baseUrl}/api/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rpcUrl: RPC_URL,
        transactions: [
          {
            from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // vitalik.eth
            to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',   // WETH contract
            value: '1000000000000000000', // 1 ETH
            data: '0xd0e30db0',           // deposit()
          }
        ],
        expect: []
      })
    });

    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result).toMatchObject({
      success: true,
      results: {
        transactions: [
          {
            success: true,
            hash: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
            gasUsed: expect.any(String)
          }
        ]
      }
    });
  });

  it('should handle multiple transactions in sequence', async () => {
    const response = await fetch(`${baseUrl}/api/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rpcUrl: RPC_URL,
        transactions: [
          {
            from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
            to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            value: '1000000000000000000',
            data: '0xd0e30db0', // deposit()
          },
          {
            from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
            to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            data: '0x2e1a7d4d0000000000000000000000000000000000000000000000000de0b6b3a7640000', // withdraw(1 ETH)
          }
        ],
        expect: []
      })
    });

    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result).toMatchObject({
      success: true,
      results: {
        transactions: expect.arrayContaining([
          expect.objectContaining({
            success: true,
            hash: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
            gasUsed: expect.any(String)
          })
        ])
      }
    });
    expect(result.results.transactions).toHaveLength(2);
  });

  it('should handle failed contract call transactions', async () => {
    const response = await fetch(`${baseUrl}/api/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rpcUrl: RPC_URL,
        transactions: [
          {
            // Try to withdraw WETH without having any balance
            from: '0xa8da6bf26964af9d7eed9e03e53415d37aa96045',
            to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            data: '0x2e1a7d4d0000000000000000000000000000000000000000000000000de0b6b3a7640000', // withdraw(1 ETH)
          }
        ],
        expect: []
      })
    });

    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result).toMatchObject({
      success: true,
      results: {
        transactions: [
          {
            success: false,
            error: expect.any(String)
          }
        ]
      }
    });
  });

  it('should handle failed ETH balance transfer transactions', async () => {
    const walletClient = createWalletClient({
      account: privateKeyToAccount(generatePrivateKey()),
      chain: mainnet,
      transport: http(RPC_URL),
    })
    const [address] = await walletClient.getAddresses();
    const response = await fetch(`${baseUrl}/api/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rpcUrl: RPC_URL,
        transactions: [
          {
            from: address, // Sending from address with 0 ETH
            to: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // vitalik.eth
            value: '1000000000000000000', // 1 ETH
          }
        ],
        expect: []
      })
    });

    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result).toMatchObject({
      success: true,
      results: {
        transactions: [
          {
            success: false,
            error: expect.any(String)
          }
        ]
      }
    });
  });

  it('should handle transactions that would fail if done out of sequence', async () => {
    const walletClient = createWalletClient({
      account: privateKeyToAccount(generatePrivateKey()),
      chain: mainnet,
      transport: http(RPC_URL),
    })
    const [address] = await walletClient.getAddresses();
    const tx1 = {
      from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // vitalik.eth
      to: address, // address with 0 ETH
      value: '1000000000000000000', // 1 ETH
    };

    const tx2 = {
      from: address, // address with 0 ETH unless tx1 is executed
      to: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // vitalik.eth
      value: '900000000000000000', // .9 ETH
    };
    const response = await fetch(`${baseUrl}/api/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rpcUrl: RPC_URL,
        transactions: [
          tx1,
          tx2
        ],
        expect: []
      })
    });

    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result).toMatchObject({
      success: true,
      results: {
        transactions: expect.arrayContaining([
          expect.objectContaining({
            success: true,
            hash: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
            gasUsed: expect.any(String)
          })
        ])
      }
    });
    expect(result.results.transactions).toHaveLength(2);

    // Try them out of order now
    const responseOOO = await fetch(`${baseUrl}/api/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rpcUrl: RPC_URL,
        transactions: [
          tx2,
          tx1
        ],
        expect: []
      })
    });

    expect(responseOOO.status).toBe(200);
    
    const resultOOO = await responseOOO.json();
    
    expect(resultOOO.results.transactions).toHaveLength(2);
    expect(resultOOO).toMatchObject({
      success: true,
      results: {
        transactions: [
          expect.objectContaining({
            success: false,
            error: expect.any(String)
          }),
          expect.objectContaining({
            success: true,
            hash: expect.stringMatching(/^0x[a-fA-F0-9]{64}$/),
            gasUsed: expect.any(String)
          })
        ]
      }
    });
  });
}); 

