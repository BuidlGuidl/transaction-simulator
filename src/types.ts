export interface Transaction {
  from: string;
  to: string;
  data?: string;
  value?: bigint | string;
  gasLimit?: bigint | string;
}

export interface SimulationRequest {
  chainId: number;
  transactions: Transaction[];
  expect: any[]; // We'll type this more specifically when we implement expectations
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  gasUsed?: bigint;
  error?: string;
}

export interface SimulationResponse {
  success: boolean;
  results?: {
    transactions: TransactionResult[];
  };
  error?: string;
} 