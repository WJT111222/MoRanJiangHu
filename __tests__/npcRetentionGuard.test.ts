import { describe, expect, it } from 'vitest';
import { 合并保留既有NPC列表, 检测社交删除风险命令, 是否占位名, 实质为空文本 } from '../utils/npcRetentionGuard';

describe('npcRetentionGuard', () => {
    const currentSocial = [
        { id: 'npc_old', 姓名: '沈青棠', 身份: '旧友' },
        { id: 'npc_second', 姓名: '陆明珂', 身份: '掌柜' }
    ];

    it('detects direct social deletion commands', () => {
        expect(检测社交删除风险命令([
            { action: 'delete', key: '社交[0]' }
        ] as any, currentSocial)).toHaveLength(1);

        expect(检测社交删除风险命令([
            { action: 'delete', key: '社交[0].记忆[0]' }
        ] as any, currentSocial)).toHaveLength(0);
    });

    it('detects full social replacement that drops existing NPCs', () => {
        const issues = 检测社交删除风险命令([
            { action: 'set', key: '社交', value: [{ id: 'npc_second', 姓名: '陆明珂' }] }
        ] as any, currentSocial);

        expect(issues.join('\n')).toContain('沈青棠');
    });

    it('restores missing existing NPCs without rewriting retained NPCs', () => {
        const result = 合并保留既有NPC列表(currentSocial, [
            { id: 'npc_second', 姓名: '陆明珂', 身份: '掌柜', 好感度: 20 }
        ]);

        expect(result.恢复数量).toBe(1);
        expect(result.恢复名称).toEqual(['沈青棠']);
        expect(result.列表.map((npc: any) => npc.姓名)).toEqual(['沈青棠', '陆明珂']);
        expect(result.列表[1].好感度).toBe(20);
    });

    // ── 新增：占位名识别 ──────────────────────────────────────────────
    describe('是否占位名', () => {
        it('detects NPC placeholder names like 角色0', () => {
            expect(是否占位名('角色0')).toBe(true);
            expect(是否占位名('角色1')).toBe(true);
            expect(是否占位名('角色99')).toBe(true);
        });

        it('detects kungfu placeholder names like 未命名功法1', () => {
            expect(是否占位名('未命名功法1')).toBe(true);
            expect(是否占位名('未命名功法10')).toBe(true);
            expect(是否占位名('未命名武功3')).toBe(true);
        });

        it('detects faction placeholder names like 势力 1', () => {
            expect(是否占位名('势力 1')).toBe(true);
            expect(是否占位名('势力 5')).toBe(true);
            expect(是否占位名('势力 10')).toBe(true);
        });

        it('detects ID-style placeholder names', () => {
            expect(是否占位名('npc_0')).toBe(true);
            expect(是否占位名('npc_99')).toBe(true);
            expect(是否占位名('FCT-001')).toBe(true);
            expect(是否占位名('FCT-010')).toBe(true);
        });

        it('does not treat real names as placeholders', () => {
            expect(是否占位名('黑风堂')).toBe(false);
            expect(是否占位名('沈青棠')).toBe(false);
            expect(是否占位名('念动力牵引')).toBe(false);
            expect(是否占位名('中州队')).toBe(false);
        });

        it('treats empty/null/undefined as placeholder', () => {
            expect(是否占位名('')).toBe(true);
            expect(是否占位名(null as any)).toBe(true);
            expect(是否占位名(undefined as any)).toBe(true);
        });
    });

    // ── 新增：实质为空文本检测 ──────────────────────────────────────────
    describe('实质为空文本', () => {
        it('detects empty strings, null, and undefined', () => {
            expect(实质为空文本('')).toBe(true);
            expect(实质为空文本('  ')).toBe(true);
            expect(实质为空文本(null)).toBe(true);
            expect(实质为空文本(undefined)).toBe(true);
        });

        it('does not treat real text as empty', () => {
            expect(实质为空文本('黑风堂')).toBe(false);
            expect(实质为空文本('角色1')).toBe(false);
        });
    });

    // ── 新增：深合并名称保护 ──────────────────────────────────────────
    describe('深合并保留NPC字段 - 名称字段空值保护', () => {
        it('protects real names from being overwritten by empty strings', () => {
            const result = 合并保留既有NPC列表(
                [{ id: 'npc_1', 姓名: '黑风堂', 当前血量: 100 }],
                [{ id: 'npc_1', 姓名: '', 当前血量: 50 }]
            );
            // The NPC should have its name preserved via deep merge
            const merged = result.列表.find((n: any) => n.id === 'npc_1');
            expect(merged?.姓名).toBe('黑风堂');
        });

        it('protects real names from being overwritten by placeholder names', () => {
            const result = 合并保留既有NPC列表(
                [{ id: 'npc_1', 姓名: '俞月荷', 当前血量: 100 }],
                [{ id: 'npc_1', 姓名: '角色0', 当前血量: 50 }]
            );
            const merged = result.列表.find((n: any) => n.id === 'npc_1');
            expect(merged?.姓名).toBe('俞月荷');
        });

        it('allows real name changes when new name is not empty or placeholder', () => {
            const result = 合并保留既有NPC列表(
                [{ id: 'npc_1', 姓名: '俞月荷', 当前血量: 100 }],
                [{ id: 'npc_1', 姓名: '月荷', 当前血量: 50 }]
            );
            const merged = result.列表.find((n: any) => n.id === 'npc_1');
            expect(merged?.姓名).toBe('月荷');
        });

        it('allows placeholder to be replaced by real name', () => {
            const result = 合并保留既有NPC列表(
                [{ id: 'npc_1', 姓名: '角色0', 当前血量: 100 }],
                [{ id: 'npc_1', 姓名: '黑风堂', 当前血量: 50 }]
            );
            const merged = result.列表.find((n: any) => n.id === 'npc_1');
            expect(merged?.姓名).toBe('黑风堂');
        });
    });

    // ── 新增：id 优先匹配 ──────────────────────────────────────────
    describe('合并保留既有NPC列表 - id 优先匹配', () => {
        it('matches by ID when 姓名 was changed to placeholder', () => {
            const result = 合并保留既有NPC列表(
                [{ id: 'npc_stable_id', 姓名: '陆明珂', 好感度: 80 }],
                [{ id: 'npc_stable_id', 姓名: '角色0', 好感度: 50 }]
            );
            const merged = result.列表.find((n: any) => n.id === 'npc_stable_id');
            expect(merged?.姓名).toBe('陆明珂');
            expect(merged?.好感度).toBe(50);
        });
    });
});
