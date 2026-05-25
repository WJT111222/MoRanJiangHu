import type {
    RealmDiyDraft,
    RealmDiyRow,
    WorldGenConfig,
    WorldMapDiyDraft,
    WorldMapDiyLayerType,
    WorldMapDiyNode,
} from '../types';

const LAYER_ORDER: WorldMapDiyLayerType[] = ['寰宇', '大地点', '中地点', '小地点', '区地点', '子地点'];

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const createEmptyRealmDraft = (): RealmDiyDraft => ({
    rows: [
        {
            id: createId('realm'),
            name: '开脉',
            level: 1,
            power: '入门',
            breakthrough: '以启蒙为主',
            parameters: '寿元、内力、灵力、神识可由 AI 补完',
            description: 'AI 补完描述'
        }
    ],
    updatedAt: Date.now()
});

export const createEmptyWorldMapDraft = (): WorldMapDiyDraft => ({
    nodes: [
        {
            id: createId('map'),
            name: '诸天万界',
            layer: '寰宇',
            parentId: '',
            description: '世界总根节点'
        }
    ],
    referenceOpacity: 0.3,
    updatedAt: Date.now()
});

export const normalizeRealmDraft = (draft?: RealmDiyDraft | null): RealmDiyDraft => ({
    rows: Array.isArray(draft?.rows) && draft.rows.length > 0
        ? draft.rows.map((row, index) => normalizeRealmRow(row, index))
        : createEmptyRealmDraft().rows,
    updatedAt: Date.now()
});

export const normalizeWorldMapDraft = (draft?: WorldMapDiyDraft | null): WorldMapDiyDraft => ({
    nodes: Array.isArray(draft?.nodes) && draft.nodes.length > 0
        ? draft.nodes.map((node, index) => normalizeWorldMapNode(node, index))
        : createEmptyWorldMapDraft().nodes,
    referenceImage: typeof draft?.referenceImage === 'string' ? draft.referenceImage : '',
    referenceOpacity: typeof draft?.referenceOpacity === 'number' ? Math.max(0, Math.min(1, draft.referenceOpacity)) : 0.3,
    updatedAt: Date.now()
});

export const normalizeRealmRow = (row: Partial<RealmDiyRow> | undefined, index: number): RealmDiyRow => ({
    id: typeof row?.id === 'string' && row.id.trim() ? row.id.trim() : createId(`realm_row_${index}`),
    name: typeof row?.name === 'string' ? row.name.trim() : '',
    level: Number.isFinite(Number(row?.level)) ? Math.max(1, Math.round(Number(row?.level))) : index + 1,
    power: typeof row?.power === 'string' ? row.power.trim() : '',
    breakthrough: typeof row?.breakthrough === 'string' ? row.breakthrough.trim() : '',
    parameters: typeof row?.parameters === 'string' ? row.parameters.trim() : '',
    description: typeof row?.description === 'string' ? row.description.trim() : ''
});

export const normalizeWorldMapNode = (node: Partial<WorldMapDiyNode> | undefined, index: number): WorldMapDiyNode => ({
    id: typeof node?.id === 'string' && node.id.trim() ? node.id.trim() : createId(`map_node_${index}`),
    name: typeof node?.name === 'string' ? node.name.trim() : '',
    layer: LAYER_ORDER.includes(node?.layer as WorldMapDiyLayerType) ? node!.layer! : '小地点',
    parentId: typeof node?.parentId === 'string' ? node.parentId.trim() : '',
    description: typeof node?.description === 'string' ? node.description.trim() : '',
    climate: typeof node?.climate === 'string' ? node.climate.trim() : '',
    population: typeof node?.population === 'string' ? node.population.trim() : '',
    culture: typeof node?.culture === 'string' ? node.culture.trim() : '',
    transport: typeof node?.transport === 'string' ? node.transport.trim() : ''
});

export const buildRealmPromptFromDraft = (draft: RealmDiyDraft): string => {
    const lines = ['<境界体系>', '【境界结构】'];
    draft.rows.forEach((row, index) => {
        lines.push([
            `${index + 1}. ${row.name || `未命名境界${index + 1}`}`,
            `层级：${row.level}`,
            `战力定位：${row.power || '待补完'}`,
            `突破条件：${row.breakthrough || '待补完'}`,
            `参数：${row.parameters || '待补完'}`,
            `描述：${row.description || 'AI 补完'}`,
        ].join(' | '));
    });
    lines.push('</境界体系>');
    return lines.join('\n');
};

export const buildWorldMapPromptFromDraft = (draft: WorldMapDiyDraft): string => {
    const lines = ['<世界地图>', '【地点树】'];
    draft.nodes.forEach((node) => {
        lines.push([
            `${node.layer}：${node.name || '未命名'}`,
            `父级：${node.parentId || '无'}`,
            `描述：${node.description || 'AI 补完'}`,
            `气候：${node.climate || '待补完'}`,
            `人口：${node.population || '待补完'}`,
            `风土人情：${node.culture || '待补完'}`,
            `交通：${node.transport || '待补完'}`
        ].join(' | '));
    });
    lines.push('</世界地图>');
    return lines.join('\n');
};

export const buildWorldMapLayersFromDraft = (draft: WorldMapDiyDraft): any[] => {
    return draft.nodes
        .filter((node) => node.name.trim())
        .map((node) => ({
            ID: node.id,
            名称: node.name,
            层级: node.layer,
            描述: [node.description, node.climate, node.population, node.culture, node.transport].filter(Boolean).join(' / '),
            父级ID: node.parentId || ''
        }));
};

export const createWorldConfigWithDiy = (worldConfig: WorldGenConfig): WorldGenConfig => ({
    ...worldConfig,
    realmDiyDraft: normalizeRealmDraft(worldConfig.realmDiyDraft),
    mapDiyDraft: normalizeWorldMapDraft(worldConfig.mapDiyDraft)
});
