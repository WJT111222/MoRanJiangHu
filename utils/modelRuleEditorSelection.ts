export const 解析模型规则编辑选中ID = (params: {
    当前编辑ID?: string;
    可选规则ID列表: string[];
    默认规则ID?: string;
}): string => {
    const currentId = (params.当前编辑ID || '').trim();
    const availableIds = params.可选规则ID列表.map((id) => id.trim()).filter(Boolean);
    if (currentId && availableIds.includes(currentId)) return currentId;

    const defaultId = (params.默认规则ID || '').trim();
    if (defaultId && availableIds.includes(defaultId)) return defaultId;
    return availableIds[0] || '';
};
