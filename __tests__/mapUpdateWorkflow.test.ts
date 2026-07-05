import { afterEach, describe, expect, it, vi } from 'vitest';
import { 生成地图更新, 解析地图自动更新命令, 构建地图层级替换结果 } from '../hooks/useGame/mapUpdateWorkflow';

vi.mock('../services/ai/chatCompletionClient', async () => {
    const actual = await vi.importActual<any>('../services/ai/chatCompletionClient');
    return {
        ...actual,
        请求模型文本: vi.fn()
    };
});

vi.mock('../utils/apiConfig', async () => {
    const actual = await vi.importActual<any>('../utils/apiConfig');
    return {
        ...actual,
        获取地图生成接口配置: vi.fn((settings: any) => settings?.configs?.[0] || null),
        获取地图自动更新接口配置: vi.fn((settings: any) => settings?.configs?.[0] || null),
        接口配置是否可用: vi.fn((api: any) => Boolean(api?.baseUrl && api?.apiKey && api?.model))
    };
});

vi.mock('../services/diagnosticLog', () => ({
    recordDiagnosticLog: vi.fn()
}));

const { 请求模型文本 } = await import('../services/ai/chatCompletionClient');
const { recordDiagnosticLog } = await import('../services/diagnosticLog');

afterEach(() => {
    vi.useRealTimers();
    vi.mocked(请求模型文本).mockReset();
    vi.mocked(recordDiagnosticLog).mockReset();
});

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

    it('push 命令不保留「在场人物」字段（人物显示由社交 NPC 位置驱动）', () => {
        const currentWorld = { 地图层级: [] };
        const rawText = [
            '<命令>',
            'push 世界.地图层级 = {"名称":"队伍房间","层级":"小地点","父级ID":"DT-001","描述":"小队驻地。","在场人物":["杨培强"]}',
            '</命令>'
        ].join('\n');
        const commands = 解析地图自动更新命令(rawText, currentWorld);
        expect(commands).toHaveLength(1);
        expect(commands[0].value).toMatchObject({ 名称: '队伍房间', 层级: '小地点' });
        // 方案 A：地图层级节点不应携带「在场人物」字段
        expect(commands[0].value).not.toHaveProperty('在场人物');
    });
});

describe('构建地图层级替换结果 — 不保留「在场人物」', () => {
    it('即便输入节点带「在场人物」，结果节点也不携带该字段', () => {
        const rawNodes = [
            { 名称: '主神空间', 层级: '寰宇', 父级ID: '', 描述: '', 在场人物: [] },
            { 名称: '队伍房间', 层级: '小地点', 父级ID: '主神空间', 描述: '', 在场人物: ['杨培强', '俞月荷'] }
        ];
        const result = 构建地图层级替换结果(rawNodes);
        const room = result.find(r => r.名称 === '队伍房间');
        expect(room).toBeDefined();
        expect(room.层级).toBe('小地点');
        // 方案 A：地图层级节点不应携带「在场人物」字段，人物显示走社交 NPC 位置链路
        expect(room).not.toHaveProperty('在场人物');
    });

    it('势力标签等地点属性仍正常保留', () => {
        const rawNodes = [
            { 名称: '诸天万界', 层级: '寰宇', 父级ID: '', 描述: '' },
            { 名称: '悦来客栈', 层级: '区地点', 父级ID: '诸天万界', 描述: '客栈。', 控制势力: '商会', 势力标签: ['商会', '帮会'] }
        ];
        const result = 构建地图层级替换结果(rawNodes);
        const inn = result.find(r => r.名称 === '悦来客栈');
        expect(inn).toBeDefined();
        expect(inn.控制势力).toBe('商会');
        expect(inn.势力标签).toEqual(['商会', '帮会']);
        expect(inn).not.toHaveProperty('在场人物');
    });
});

describe('地图更新请求兜底超时', () => {
    it('记录地图更新请求边界日志，方便定位卡住阶段', async () => {
        vi.mocked(请求模型文本).mockResolvedValue([
            '<thinking>无需新增地点。</thinking>',
            '<说明>- 本回合没有新增长期地点。</说明>',
            '<命令>无</命令>'
        ].join('\n'));

        const result = await 生成地图更新({
            mode: 'auto_incremental',
            apiSettings: {
                configs: [{
                    id: 'map',
                    名称: '地图测试接口',
                    供应商: 'openai_compatible',
                    协议覆盖: 'openai',
                    baseUrl: 'https://example.test/v1',
                    apiKey: 'test-key',
                    model: 'test-model'
                }],
                功能模型占位: {
                    地图生成功能启用: true
                }
            } as any,
            环境: { 大地点: '云岫剑宗', 具体地点: '青瓦木屋' } as any,
            世界: { 地图层级: [{ ID: 'DT-001', 名称: '云岫剑宗', 层级: '大地点' }] } as any,
            社交: [{ 姓名: '俞月荷' }],
            角色: { 姓名: '测试少侠' },
            gameConfig: {},
            worldbooks: [],
            currentResponse: { logs: [{ sender: '旁白', text: '清晨醒来。' }], tavern_commands: [] } as any
        });

        expect(result.phase).toBe('skipped');
        const logText = vi.mocked(recordDiagnosticLog).mock.calls
            .map((call) => JSON.stringify(call))
            .join('\n');
        expect(logText).toContain('[地图更新] stage-start');
        expect(logText).toContain('[地图更新] request-start');
        expect(logText).toContain('[地图更新] request-success');
        expect(logText).toContain('[地图更新] auto-incremental-parsed');
        expect(logText).toContain('existingLayerCount');
        expect(logText).toContain('baseUrlHost');
        expect(logText).not.toContain('test-key');
    });

    it('底层地图模型请求无响应时返回超时跳过结果，避免后台队列永久卡住', async () => {
        vi.useFakeTimers();
        vi.mocked(请求模型文本).mockImplementation(() => new Promise<string>(() => undefined));

        const resultPromise = 生成地图更新({
            mode: 'auto_incremental',
            apiSettings: {
                configs: [{
                    id: 'map',
                    名称: '地图测试接口',
                    供应商: 'openai_compatible',
                    协议覆盖: 'openai',
                    baseUrl: 'https://example.test/v1',
                    apiKey: 'test-key',
                    model: 'test-model'
                }],
                功能模型占位: {
                    地图生成功能启用: true
                }
            } as any,
            环境: { 大地点: '云岫剑宗', 具体地点: '青瓦木屋' } as any,
            世界: { 地图层级: [] } as any,
            社交: [],
            角色: { 姓名: '测试少侠' },
            gameConfig: {},
            worldbooks: [],
            currentResponse: { logs: [{ sender: '旁白', text: '清晨醒来。' }], tavern_commands: [] } as any
        });

        await vi.advanceTimersByTimeAsync(125_000);
        const result = await resultPromise;

        expect(result).toMatchObject({
            ok: false,
            phase: 'skipped',
            commands: []
        });
        expect(result.statusText).toMatch(/超时|跳过|地图更新/);
        const logText = vi.mocked(recordDiagnosticLog).mock.calls
            .map((call) => JSON.stringify(call))
            .join('\n');
        expect(logText).toContain('[地图更新] request-start');
        expect(logText).toContain('[地图更新] request-timeout-skip');
        expect(logText).not.toContain('test-key');
    });
});
