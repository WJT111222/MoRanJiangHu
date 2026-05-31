import { describe, expect, it } from 'vitest';
import { 规范化ComfyUI工作流JSON } from '../services/ai/comfyWorkflowTools';

describe('规范化ComfyUI工作流JSON', () => {
    it('replaces common ComfyUI API workflow inputs with placeholders', () => {
        const normalized = 规范化ComfyUI工作流JSON({
            '1': {
                class_type: 'CLIPTextEncode',
                _meta: { title: 'Positive Prompt' },
                inputs: { text: 'masterpiece, wuxia hero' }
            },
            '2': {
                class_type: 'CLIPTextEncode',
                _meta: { title: 'Negative Prompt' },
                inputs: { text: 'lowres, bad anatomy' }
            },
            '3': {
                class_type: 'EmptyLatentImage',
                inputs: { width: 832, height: 1216 }
            },
            '4': {
                class_type: 'KSampler',
                inputs: {
                    seed: 123,
                    steps: 28,
                    cfg: 7,
                    sampler_name: 'euler',
                    scheduler: 'normal'
                }
            }
        });

        const workflow = JSON.parse(normalized);
        expect(workflow['1'].inputs.text).toBe('__PROMPT__');
        expect(workflow['2'].inputs.text).toBe('__NEGATIVE_PROMPT__');
        expect(workflow['3'].inputs.width).toBe('__WIDTH__');
        expect(workflow['3'].inputs.height).toBe('__HEIGHT__');
        expect(workflow['4'].inputs.seed).toBe('__SEED__');
        expect(workflow['4'].inputs.steps).toBe('__STEPS__');
        expect(workflow['4'].inputs.cfg).toBe('__CFG__');
        expect(workflow['4'].inputs.sampler_name).toBe('__SAMPLER__');
        expect(workflow['4'].inputs.scheduler).toBe('__SCHEDULER__');
    });

    it('falls back to the first text node when a positive prompt is not obvious', () => {
        const workflow = JSON.parse(规范化ComfyUI工作流JSON({
            '1': {
                class_type: 'CLIPTextEncode',
                inputs: { text: 'quiet bamboo grove' }
            }
        }));

        expect(workflow['1'].inputs.text).toBe('__PROMPT__');
    });

    it('unwraps nested player workflow JSON and converts legacy percent placeholders', () => {
        const workflow = JSON.parse(规范化ComfyUI工作流JSON({
            anima工作流: JSON.stringify({
                '3': {
                    class_type: 'KSampler',
                    inputs: {
                        seed: '%seed%',
                        steps: '%steps%',
                        cfg: '%cfg_scale%',
                        sampler_name: '%sampler_name%',
                        scheduler: 'simple',
                        positive: ['23', 1],
                        negative: ['23', 2],
                    }
                },
                '13': {
                    class_type: 'EmptySD3LatentImage',
                    inputs: { width: '%width%', height: '%height%', batch_size: 1 }
                },
                '23': {
                    class_type: 'WeiLinComfyUIPromptToLoras',
                    inputs: {
                        positive: '%prompt%',
                        negative: '%negative_prompt%',
                    }
                }
            })
        }));

        expect(workflow['3'].inputs.seed).toBe('__SEED__');
        expect(workflow['3'].inputs.steps).toBe('__STEPS__');
        expect(workflow['3'].inputs.cfg).toBe('__CFG__');
        expect(workflow['3'].inputs.sampler_name).toBe('__SAMPLER__');
        expect(workflow['13'].inputs.width).toBe('__WIDTH__');
        expect(workflow['13'].inputs.height).toBe('__HEIGHT__');
        expect(workflow['23'].inputs.positive).toBe('__PROMPT__');
        expect(workflow['23'].inputs.negative).toBe('__NEGATIVE_PROMPT__');
    });

    it('rejects non-object workflow payloads', () => {
        expect(() => 规范化ComfyUI工作流JSON([])).toThrow('必须是对象');
    });
});
