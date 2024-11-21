export function parseAnvilError(error: Error): string {
  const message = error.message;

  // Common Anvil error patterns
  const patterns = [
    // Revert errors
    /execution reverted: (.*?)(?:\n|$)/i,
    // EVM errors
    /VM Exception while processing transaction: (.*?)(?:\n|$)/i,
    // Specific error messages from contracts
    /Error: (.+?) \(code = /i,
    // Generic execution errors
    /execution failed \((.*?)\)/i,
    // Insufficient funds
    /insufficient funds for gas \* price \+ value/i,
    // Nonce too low
    /nonce too low/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  // If no specific pattern matches, try to extract the most relevant part
  const relevantLines = message
    .split('\n')
    .filter(line => 
      line.includes('error') || 
      line.includes('revert') || 
      line.includes('failed')
    );

  if (relevantLines.length > 0) {
    return relevantLines[0].trim();
  }

  // Fallback to the original message if no better format is found
  return message;
} 