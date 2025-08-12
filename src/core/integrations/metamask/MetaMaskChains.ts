import * as wagmiChains from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';

// Gather all chain objects exported from wagmi
const allChains = Object.values(wagmiChains).filter(
  (chain) => typeof chain === 'object' && chain !== null && 'id' in (chain as any)
) as Chain[];

if (allChains.length === 0) {
  throw new Error('No chains found in wagmi');
}

export const metaMaskChains = allChains as unknown as [Chain, ...Chain[]];

export const chainIdToName = metaMaskChains.reduce((merged, chain) => {
  merged[chain.id] = chain.name;
  return merged;
}, {} as { [chainId: number]: string });

