import { describe, expect, it } from 'vitest';
import { 解析地图自动更新命令 } from '../hooks/useGame/mapUpdateWorkflow';

describe('地图自动更新解析', () => {
    it('兼容模型返回思考块加地点树 JSON 的全量同步格式', () => {
        const currentWorld = {
            地图层级: [
                { ID: 'DT-001', 名称: '主神空间', 层级: '寰宇', 父级ID: '', 描述: '旧描述' },
                { ID: 'DT-002', 名称: '主神广场', 层级: '大地点', 父级ID: 'DT-001', 描述: '旧描述' }
            ]
        };
        const rawText = [
            '<思考>',
            '本回合新增任务世界、封门村与东偏厅，需要同步地点树。',
            '</思考>',
            JSON.stringify({
                地点树: [
                    { 名称: '主神空间', 层级: '寰宇', 父级ID: '', 描述: '一切轮回的起点。' },
                    { 名称: '主神广场', 层级: '大地点', 父级ID: '主神空间', 描述: '主神光球所在广场。' },
                    { 名称: '任务世界<荒怨>', 层级: '大地点', 父级ID: '主神空间', 描述: '充满诡异气息的任务世界。' },
                    { 名称: '封门村区域', 层级: '中地点', 父级ID: '任务世界<荒怨>', 描述: '被雾气笼罩的荒野区域。' },
                    { 名称: '封门村', 层级: '小地点', 父级ID: '封门村区域', 描述: '死寂的诡异村落。' },
                    { 名称: '荒废古宅', 层级: '区地点', 父级ID: '封门村', 描述: '民国风破败老宅。' },
                    { 名称: '东偏厅', 层级: '子地点', 父级ID: '荒废古宅', 描述: '光线昏暗的偏厅。' }
                ]
            }, null, 2)
        ].join('\n');

        const commands = 解析地图自动更新命令(rawText, currentWorld);

        expect(commands).toHaveLength(1);
        expect(commands[0]).toMatchObject({
            action: 'set',
            key: '世界.地图层级'
        });
        expect(commands[0].value).toEqual(expect.arrayContaining([
            expect.objectContaining({ ID: 'DT-001', 名称: '主神空间', 层级: '寰宇' }),
            expect.objectContaining({ ID: 'DT-002', 名称: '主神广场', 层级: '大地点', 父级ID: 'DT-001' }),
            expect.objectContaining({ 名称: '东偏厅', 层级: '子地点' })
        ]));
    });
});
