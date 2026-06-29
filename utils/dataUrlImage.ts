export const DATA_URL_IMAGE_OBJECT_URL_THRESHOLD = 512 * 1024;

const DATA_URL_PATTERN = /^data:([^;,]+);base64,(.*)$/is;

export const 是否Base64图片DataUrl = (value: unknown): value is string => (
    typeof value === 'string' && /^data:image\/[^;,]+;base64,/i.test(value)
);

export const 估算Base64DataUrl字节数 = (dataUrl: string): number => {
    const commaIndex = dataUrl.indexOf(',');
    const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1).replace(/\s+/g, '') : dataUrl.replace(/\s+/g, '');
    if (!base64) return 0;
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
};

export const 需要转为ObjectUrl展示 = (
    value: unknown,
    threshold = DATA_URL_IMAGE_OBJECT_URL_THRESHOLD
): value is string => 是否Base64图片DataUrl(value) && 估算Base64DataUrl字节数(value) >= threshold;

export const base64图片DataUrl转Blob = (dataUrl: string): Blob => {
    const matched = dataUrl.match(DATA_URL_PATTERN);
    if (!matched) {
        throw new Error('不是有效的 base64 图片 Data URL');
    }
    const mimeType = matched[1] || 'image/png';
    const base64 = (matched[2] || '').replace(/\s+/g, '');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: mimeType });
};
