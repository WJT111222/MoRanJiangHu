import { describe, expect, it } from 'vitest';
import { 获取图片展示地址 } from '../utils/imageAssets';

describe('imageAssets', () => {
    it('falls back to remote image url when local asset ref is not cached', () => {
        const remoteUrl = 'https://image.bacon159.pp.ua/file/example.png';

        expect(获取图片展示地址({
            本地路径: 'wuxia-asset://missing-local-cache',
            图片URL: remoteUrl
        })).toBe(remoteUrl);
    });
});
