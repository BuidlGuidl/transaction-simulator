import { describe, it, expect } from 'vitest';

describe('Simulation API', () => {
  const port = 3001; // Different port than main server
  const baseUrl = `http://localhost:${port}`;

  it('should simulate a simple ETH transfer', async () => {
    const response = await fetch(`${baseUrl}/api/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chainId: 1,
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
        chainId: 1,
        transactions: [
          {
            // First deposit ETH to WETH
            from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
            to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            value: '1000000000000000000',
            data: '0xd0e30db0', // deposit()
          },
          {
            // Then withdraw the WETH
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

  it('should handle failed transactions', async () => {
    const response = await fetch(`${baseUrl}/api/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chainId: 1,
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
}); 