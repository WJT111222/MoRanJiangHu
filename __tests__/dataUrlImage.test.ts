import { describe, expect, it } from 'vitest';
import {
    base64图片DataUrl转Blob,
    估算Base64DataUrl字节数,
    是否Base64图片DataUrl,
    需要转为ObjectUrl展示
} from '../utils/dataUrlImage';

describe('dataUrlImage', () => {
    it('识别 base64 图片 Data URL 并排除普通 URL', () => {
        expect(是否Base64图片DataUrl('data:image/png;base64,QUJD')).toBe(true);
        expect(是否Base64图片DataUrl('https://example.com/a.png')).toBe(false);
        expect(是否Base64图片DataUrl('data:text/plain;base64,QUJD')).toBe(false);
    });

    it('估算 base64 Data URL 字节数时会处理 padding 和空白', () => {
        expect(估算Base64DataUrl字节数('data:image/png;base64,QUJD')).toBe(3);
        expect(估算Base64DataUrl字节数('data:image/png;base64,QUI=')).toBe(2);
        expect(估算Base64DataUrl字节数('data:image/png;base64,Q Q==')).toBe(1);
    });

    it('只把超过阈值的 base64 图片转入 Object URL 展示路径', () => {
        expect(需要转为ObjectUrl展示('data:image/png;base64,QUJD', 3)).toBe(true);
        expect(需要转为ObjectUrl展示('data:image/png;base64,QUJD', 4)).toBe(false);
        expect(需要转为ObjectUrl展示('https://example.com/a.png', 1)).toBe(false);
    });

    it('把 base64 图片 Data URL 转成带 MIME 类型的 Blob', async () => {
        const blob = base64图片DataUrl转Blob('data:image/png;base64,QUJD');

        expect(blob.type).toBe('image/png');
        expect(blob.size).toBe(3);
        expect(await blob.text()).toBe('ABC');
    });
});
