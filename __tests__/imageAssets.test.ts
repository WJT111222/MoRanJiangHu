import { describe, expect, it } from 'vitest';
import { 图片资源记录含可恢复地址 } from '../utils/imageAssets';

describe('imageAssets', () => {
    it('treats successful local or remote image records as recoverable without requiring a warm cache', () => {
        expect(图片资源记录含可恢复地址({ 本地路径: 'wuxia-asset://npc-avatar-1' })).toBe(true);
        expect(图片资源记录含可恢复地址({ 图片URL: 'https://image.bacon159.pp.ua/api/v1/file/abc' })).toBe(true);
        expect(图片资源记录含可恢复地址({ 本地路径: '' })).toBe(false);
    });
});
