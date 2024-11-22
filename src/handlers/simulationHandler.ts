import { SimulationRequest, SimulationResponse } from '../types';
import { AnvilService } from '../services/anvilService';

export async function handleSimulation(request: SimulationRequest): Promise<SimulationResponse> {
  const anvil = new AnvilService();

  try {
    console.log(`Starting simulation with RPC URL ${request.rpcUrl}...`);
    await anvil.start(request.rpcUrl);

    console.log(`Executing ${request.transactions.length} transactions...`);
    const transactionResults = await anvil.executeTransactions(request.transactions);

    return {
      success: true,
      results: {
        transactions: transactionResults
      }
    };
  } catch (error) {
    console.error('Simulation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  } finally {
    try {
      await anvil.stop();
    } catch (error) {
      console.error('Error stopping Anvil:', error);
    }
  }
} 