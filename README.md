# Transaction Simulator

A server application that simulates Ethereum (and other EVM chain) transactions using Anvil forks. This allows you to test complex transaction sequences without spending real funds.

## Features

- [x] Simulate transactions on any EVM-compatible chain
- [x] Execute multiple transactions in sequence
- [x] Impersonate any account for testing
- [x] Comprehensive transaction result reporting
- [x] Error parsing
- [ ] Support for "expectations" (e.g. users balance is adjusted)

## Prerequisites

- Node.js (v16 or higher)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed (for Anvil)

## Installation 

```bash
    git clone https://github.com/buidlguidl/transaction-simulator.git
    cd transaction-simulator
    yarn install
```

## Usage

### Starting the Server

```bash
    yarn start
```

The server will start in HTTP mode by default. To use HTTPS, place your SSL certificates in the `certs` directory:
- `certs/key.pem`: SSL private key
- `certs/cert.pem`: SSL certificate

### API Endpoints

#### POST /api/simulate

Simulates a sequence of transactions on a fork of the provided RPC URL.

Request body:
```json
    {
        "rpcUrl": "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
        "transactions": [
            {
                "from": "0xsenderAddress",
                "to": "0xtargetAddress",
                "data": "0xcalldata",
                "value": "1000000000000000000",
                "gasLimit": "100000"
            }
        ],
        "expect": [] // To Be Implemented
    }
```

Response:
```json
    {
        "success": true,
        "results": {
            "transactions": [
                {
                    "success": true,
                    "hash": "0xtransactionHash",
                    "error": "error message",
                    "gasUsed": "21000"
                }
            ]
        }
    }
```

### Example

Simulating a WETH deposit:
```bash
curl -X POST http://localhost:3000/api/simulate \
-H "Content-Type: application/json" \
-d '{
    "rpcUrl": "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
    "transactions": [{
        "from": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        "to": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "value": "1000000000000000000",
        "data": "0xd0e30db0"
    }],
    "expect": []
}'
```

## Development

### Running Tests

```bash
    yarn test
```

For tests to run successfully, you need to provide an RPC URL in your environment:
```bash
RPC_URL_ETHEREUM=https://eth-mainnet.alchemyapi.io/v2/your-api-key
```

### Running in Development Mode
```bash
    yarn dev
```

## Architecture

- `server.ts`: Main server setup with HTTP/HTTPS support
- `src/services/anvilService.ts`: Manages Anvil instances and transaction execution
- `src/handlers/simulationHandler.ts`: Handles simulation requests
- `src/types.ts`: TypeScript type definitions
- `src/utils/serialization.ts`: Utilities for handling BigInt serialization
- `src/utils/errorParser.ts`: Utilities for parsing and formatting error messages

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request