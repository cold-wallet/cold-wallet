import { createConfig, fallback, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { metaMaskChains } from './core/integrations/metamask/MetaMaskChains';

// Browser-friendly RPC endpoints for the chains that carry ~99% of the Uniswap default
// token list (the set the MetaMask loader scans). viem's per-chain defaults are not
// guaranteed to serve CORS headers — e.g. mainnet's default https://eth.merkle.io rejects
// browser origins, which silently broke every mainnet read. PublicNode serves CORS on all
// of these (verified), so it goes first; the viem default stays as a fallback.
const corsFriendlyRpc: Record<number, string[]> = {
  1: ['https://ethereum-rpc.publicnode.com', 'https://cloudflare-eth.com'], // Ethereum
  10: ['https://optimism-rpc.publicnode.com'],                              // Optimism
  56: ['https://bsc-rpc.publicnode.com'],                                   // BNB Smart Chain
  130: ['https://unichain-rpc.publicnode.com'],                             // Unichain
  137: ['https://polygon-bor-rpc.publicnode.com'],                          // Polygon
  8453: ['https://base-rpc.publicnode.com'],                                // Base
  42161: ['https://arbitrum-one-rpc.publicnode.com'],                       // Arbitrum One
  42220: ['https://celo-rpc.publicnode.com'],                               // Celo
  43114: ['https://avalanche-c-chain-rpc.publicnode.com'],                  // Avalanche C-Chain
};

export const wagmiConfig = createConfig({
  chains: metaMaskChains,
  connectors: [injected()],
  transports: Object.fromEntries(
    metaMaskChains.map((chain) => {
      const urls = corsFriendlyRpc[chain.id];
      return [chain.id, urls ? fallback([...urls.map((u) => http(u)), http()]) : http()];
    })
  ),
});
