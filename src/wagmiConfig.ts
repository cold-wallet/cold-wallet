import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { metaMaskChains } from './core/integrations/metamask/MetaMaskChains';

export const wagmiConfig = createConfig({
  chains: metaMaskChains,
  connectors: [injected()],
  transports: Object.fromEntries(
    metaMaskChains.map((chain) => [chain.id, http()])
  ),
});

