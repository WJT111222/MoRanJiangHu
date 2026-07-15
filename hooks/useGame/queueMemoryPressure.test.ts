import { describe, expect, it } from 'vitest';
import {
    构建后台队列负载指标,
    评估后台队列内存压力,
    选择后台队列执行模式
} from './queueMemoryPressure';

const 轻负载 = {
    historyChars: 8_000,
    socialCount: 8,
    mapNodeCount: 20,
    commandCount: 12,
    responseChars: 3_000
};

describe('后台队列内存压力评估', () => {
    it('正常设备与轻负载保持正常压力', () => {
        const result = 评估后台队列内存压力({
            runtime: { usedJSHeapSize: 300, jsHeapSizeLimit: 1_000, deviceMemoryGB: 8 },
            workload: 轻负载
        });

        expect(result.level).toBe('normal');
        expect(result.reasons).toEqual([]);
        expect(result.heapRatio).toBe(0.3);
    });

    it('JS 堆使用率达到高风险阈值时返回高压力', () => {
        const result = 评估后台队列内存压力({
            runtime: { usedJSHeapSize: 720, jsHeapSizeLimit: 1_000, deviceMemoryGB: 8 },
            workload: 轻负载
        });

        expect(result.level).toBe('high');
        expect(result.reasons).toContain('js_heap_ratio');
    });

    it('低内存设备遇到中等回合负载时返回高压力', () => {
        const result = 评估后台队列内存压力({
            runtime: { deviceMemoryGB: 4 },
            workload: {
                historyChars: 60_000,
                socialCount: 45,
                mapNodeCount: 120,
                commandCount: 20,
                responseChars: 6_000
            }
        });

        expect(result.level).toBe('high');
        expect(result.reasons).toContain('low_memory_device_with_medium_load');
    });

    it('没有系统内存指标但回合负载过大时仍返回高压力', () => {
        const result = 评估后台队列内存压力({
            runtime: {},
            workload: {
                historyChars: 800_000,
                socialCount: 260,
                mapNodeCount: 1_200,
                commandCount: 220,
                responseChars: 80_000
            }
        });

        expect(result.level).toBe('high');
        expect(result.reasons).toContain('large_turn_workload');
    });

    it('轻量统计正文字符和地图节点而不保留正文内容', () => {
        const workload = 构建后台队列负载指标({
            history: [
                { content: '玩家输入', structuredResponse: { logs: [{ text: '一段正文' }] } },
                { content: '系统消息' }
            ],
            social: [{ 姓名: '甲' }, { 姓名: '乙' }],
            world: {
                地图层级: [
                    { id: 'DT-1', children: [{ id: 'DT-2' }] },
                    { id: 'DT-3' }
                ]
            },
            response: {
                logs: [{ text: '本轮正文' }],
                tavern_commands: [{ action: 'set' }, { action: 'add' }]
            }
        });

        expect(workload.historyChars).toBeGreaterThan(0);
        expect(workload.responseChars).toBe(4);
        expect(workload.socialCount).toBe(2);
        expect(workload.mapNodeCount).toBe(3);
        expect(workload.commandCount).toBe(2);
        expect(JSON.stringify(workload)).not.toContain('一段正文');
    });
});

describe('后台队列执行模式选择', () => {
    it('仅在渠道允许且压力正常时并行', () => {
        expect(选择后台队列执行模式({ channelsAllowParallel: true, pressureLevel: 'normal' })).toBe('parallel');
        expect(选择后台队列执行模式({ channelsAllowParallel: true, pressureLevel: 'high' })).toBe('serial');
        expect(选择后台队列执行模式({ channelsAllowParallel: false, pressureLevel: 'normal' })).toBe('serial');
    });
});
