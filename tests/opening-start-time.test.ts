import { describe, expect, it } from 'vitest';

import { 创建开场基础状态 } from '../hooks/useGame/storyState';
import { 默认开局配置, 规范化开局配置 } from '../utils/openingConfig';

describe('开局时间设置', () => {
    it('默认开局配置使用标准开局时间', () => {
        expect(默认开局配置().自定义开局时间).toBe('1:01:01:00:00');
        expect(规范化开局配置({}).自定义开局时间).toBe('1:01:01:00:00');
    });

    it('规范化玩家输入的开局时间', () => {
        expect(规范化开局配置({ 自定义开局时间: '12:3:4:5:6' }).自定义开局时间).toBe('12:03:04:05:06');
    });

    it('创建新开局基础状态时应用自定义开局时间', () => {
        const openingConfig = 规范化开局配置({ 自定义开局时间: '8:2:3:4:5' });
        const base = 创建开场基础状态({ 姓名: '测试侠' } as any, {} as any, openingConfig);

        expect(base.环境.时间).toBe('8:02:03:04:05');
        expect(base.环境.天气?.结束日期).toBe('8:02:03:04:05');
        expect(base.游戏初始时间).toBe('8:02:03:04:05');
    });
});
