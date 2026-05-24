import { describe, expect, it } from 'vitest';
import { 构建女性姓名候选提示词 } from '../utils/femaleNameCandidatePrompt';
import { 构建变量模型职责提示词 } from '../prompts/runtime/variableModel';

describe('NPC 命名提示词', () => {
    it('不再诱导模型给每个 NPC 强行生成曾用名', () => {
        const variablePrompt = 构建变量模型职责提示词();
        const candidatePrompt = 构建女性姓名候选提示词({
            usedNames: [],
            seed: 'prompt-regression',
            count: 10
        });

        expect(variablePrompt).toContain('不要给每个 NPC 强行生成曾用名');
        expect(variablePrompt).toContain('只有确有旧称、化名、曾用称呼时才写 `曾用名`');
        expect(variablePrompt).not.toContain('真实姓名 + 身份/简介/曾用名');

        expect(candidatePrompt).toContain('只有确有旧称、化名、曾用称呼时才写 `曾用名`');
        expect(candidatePrompt).toContain('不要给每个 NPC 强行生成曾用名');
    });
});
