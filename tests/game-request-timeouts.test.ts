import { describe, expect, it } from 'vitest';

import { 默认游玩请求超时设置, 规范化游玩请求超时设置 } from '../utils/gameRequestTimeouts';

describe('游玩请求超时设置', () => {
    it('默认使用 120 秒', () => {
        expect(默认游玩请求超时设置.首次响应超时秒).toBe(120);
        expect(默认游玩请求超时设置.流式空闲超时秒).toBe(120);
        expect(规范化游玩请求超时设置(undefined)).toEqual(默认游玩请求超时设置);
    });

    it('限制玩家配置在 60 到 300 秒之间', () => {
        expect(规范化游玩请求超时设置({
            首次响应超时秒: 30,
            流式空闲超时秒: 999
        })).toEqual({
            首次响应超时秒: 60,
            流式空闲超时秒: 300
        });
    });

    it('非法值回落到默认值', () => {
        expect(规范化游玩请求超时设置({
            首次响应超时秒: Number.NaN,
            流式空闲超时秒: 'abc'
        })).toEqual(默认游玩请求超时设置);
    });
});
