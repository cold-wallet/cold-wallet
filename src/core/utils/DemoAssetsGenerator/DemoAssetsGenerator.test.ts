import { createDemoOkxAssets } from './index';
import { okxAssetPart } from '../../integrations/okx/okxApiClient';

describe('demo OKX holdings', () => {
  it('look like real OKX holdings: one per coin, so each offers its single-coin refresh', () => {
    for (let i = 0; i < 50; i++) {
      const assets = createDemoOkxAssets();
      const ids = assets.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
      assets.forEach((a) => expect(okxAssetPart(a.id)).toEqual({ part: 'spot', ccy: a.currency }));
    }
  });
});
