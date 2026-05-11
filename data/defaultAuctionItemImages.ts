import type { 物品图片档案 } from '../models/imageGeneration';

const 默认拍卖物品图片映射: Record<string, string> = {
    青锋短剑: 'https://cdn.nodeimage.com/i/wZqh7QRlKSEiEbLCwO7DaIBnq10YLRrV.png',
    雁翎护腕: 'https://cdn.nodeimage.com/i/zEhttDFHMncmZ0gYMfNtj2X1smZcmZZY.png',
    回春散: 'https://cdn.nodeimage.com/i/0pN9JCdbkb4xa8B1a8j1uYnKkeeEYRWf.png',
    寒潭玄铁屑: 'https://cdn.nodeimage.com/i/HstDkgLuw8Xls74AE3hr7d3pSzqshwMH.png',
    '残页·归云步': 'https://cdn.nodeimage.com/i/ftDHBbqt0kbMvk0bd2WVIsJvtP3hOIIb.png',
    乌金软甲: 'https://cdn.nodeimage.com/i/Pkh33zFeIABhlQgLDV5oaB2brYyIiz6W.png',
    无名刀谱拓本: 'https://cdn.nodeimage.com/i/XbbfyKPGdL4ZV3f6msDS5N12Dh1oURd5.png',
    南荒毒砂: 'https://cdn.nodeimage.com/i/otAr7BazTxbc4sh0JXDdmxUAY0MvhQ4b.png',
    白玉鱼佩: 'https://cdn.nodeimage.com/i/IfDL9aqiXWngxB0Mhj0U1fLx0QkLJQK7.png',
    破军弩机: 'https://cdn.nodeimage.com/i/lNuk31SUmb57MYc6qYvK5MccAvC765DD.png',
    药王谷旧丹方: 'https://cdn.nodeimage.com/i/WTymc2N6rniyRy2goaMBFXqBj39j4xM0.png'
};

export const 获取默认拍卖物品图片档案 = (itemName: string): 物品图片档案 | undefined => {
    const imageUrl = 默认拍卖物品图片映射[itemName];
    if (!imageUrl) return undefined;
    const id = `default_auction_${itemName}`;
    const record = {
        id,
        图片URL: imageUrl,
        生图词组: `默认拍卖行固定拍品图标：${itemName}`,
        原始描述: itemName,
        使用模型: 'comfyui-default-workflow',
        生成时间: 1778456400000,
        构图: '物品图标' as const,
        画风: '写实' as const,
        渲染风格: '写实道具' as const,
        尺寸: '1024x1024',
        状态: 'success' as const,
        来源: 'generated' as const
    };
    return {
        最近生图结果: record,
        生图历史: [record],
        已选图标图片ID: id
    };
};
