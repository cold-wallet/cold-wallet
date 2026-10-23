import * as viemChains from 'viem/chains';
import type { Chain } from 'viem/chains';

// Gather all chain objects exported from viem
const allChains = Object.values(viemChains).filter(
  (chain) => typeof chain === 'object' && chain !== null && 'id' in (chain as any)
) as Chain[];

if (allChains.length === 0) {
  throw new Error('No chains found in viem');
}

export const metaMaskChains = allChains as unknown as [Chain, ...Chain[]];

export const chainIdToName = metaMaskChains.reduce((merged, chain) => {
  merged[chain.id] = chain.name;
  return merged;
}, {} as { [chainId: number]: string });

