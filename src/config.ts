import dotenv from 'dotenv';

dotenv.config();

export const RPC_URLS: Record<number, string> = {
    1: process.env.RPC_URL_ETHEREUM || 'https://eth.llamarpc.com', // Ethereum
    8453: process.env.RPC_URL_BASE || 'https://base.rpc.url', // Base
    10: process.env.RPC_URL_OPTIMISM || 'https://optimism.llamarpc.com', // Optimism
    42161: process.env.RPC_URL_ARBITRUM || 'https://arbitrum.llamarpc.com', // Arbitrum
    5000: process.env.RPC_URL_MANTLE || 'https://mantle.rpc.url', // Mantle
    480: process.env.RPC_URL_WORLD_CHAIN || 'https://worldchain.rpc.url', // World Chain
    324: process.env.RPC_URL_ZKSYNC || 'https://zksync-mainnet.rpc.url', // ZkSync
    360: process.env.RPC_URL_SHAPE || 'https://shape.rpc.url', // Shape
    137: process.env.RPC_URL_POLYGON || 'https://polygon.llamarpc.com', // Polygon
    1101: process.env.RPC_URL_POLYGON_ZKEVM || 'https://polygon-zkevm.rpc.url', // Polygon ZkEVM
    250: process.env.RPC_URL_FANTOM || 'https://fantom-rpc.publicnode.com', // Fantom
    7000: process.env.RPC_URL_ZETACHAIN || 'https://zetachain-mainnet.public.blastapi.io', // ZetaChain
    81457: process.env.RPC_URL_BLAST || 'https://rpc.blast.io', // Blast
    59144: process.env.RPC_URL_LINEA || 'https://linea.rpc.url', // Linea
    534352: process.env.RPC_URL_SCROLL || 'https://scroll.rpc.url', // Scroll
    100: process.env.RPC_URL_GNOSIS || 'https://gnosis.rpc.url', // Gnosis
    7777777: process.env.RPC_URL_ZORA || 'https://zora.rpc.url', // Zora
    56: process.env.RPC_URL_BNB || 'https://bsc-dataseed.binance.org/', // BNB
    43114: process.env.RPC_URL_AVALANCHE || 'https://api.avax.network/ext/bc/C/rpc', // Avalanche
    747: process.env.RPC_URL_FLOW || 'https://flow.rpc.url', // Flow
    1088: process.env.RPC_URL_METIS || 'https://metis.rpc.url', // Metis
    130: process.env.RPC_URL_UNICHAIN || 'https://unichain.rpc.url', // Unichain
    30: process.env.RPC_URL_ROOTSTOCK || 'https://rootstock.rpc.url', // Rootstock
  };