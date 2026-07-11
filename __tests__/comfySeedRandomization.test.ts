import { afterEach, describe, expect, it, vi } from 'vitest';
import { __测试__构建ComfyUI工作流 } from '../services/ai/imageTasks';

const workflow = JSON.stringify({
    sampler: {
        class_type: 'KSampler',
        inputs: { seed: '__SEED__' }
    }
});

const readSeed = (随机种子生成?: boolean, pngSeed?: number): number => {
    const result = __测试__构建ComfyUI工作流(
        workflow,
        'portrait',
        'text',
        1024,
        1024,
        pngSeed === undefined ? undefined : { 随机种子: pngSeed },
        随机种子生成
    ) as any;
    return result.sampler.inputs.seed;
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('ComfyUI seed randomization', () => {
    it('uses a random 32-bit seed by default', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        expect(readSeed()).toBe(2 ** 31);
    });

    it('uses seed 0 when randomization is disabled', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        expect(readSeed(false)).toBe(0);
    });

    it('keeps an explicit PNG seed ahead of randomization', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        expect(readSeed(true, 123456)).toBe(123456);
    });
});
