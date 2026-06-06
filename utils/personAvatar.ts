import { 获取图片展示地址, 获取图片资源文本地址 } from './imageAssets';

export const 提取人物头像地址 = (person: any): string => {
    const archive = person?.图片档案 && typeof person.图片档案 === 'object' ? person.图片档案 : {};
    const history = Array.isArray(archive?.生图历史) ? archive.生图历史 : [];
    const recent = archive?.最近生图结果 || person?.最近生图结果;
    const records = [...history, recent].filter(Boolean);
    const selectedAvatarId = typeof archive?.已选头像图片ID === 'string' ? archive.已选头像图片ID.trim() : '';
    const selected = selectedAvatarId ? records.find((item) => item?.id === selectedAvatarId) : null;
    const avatar = selected || records.find((item) => item?.构图 === '头像' && item?.状态 === 'success' && 获取图片展示地址(item));
    const portrait = records.find((item) => item?.构图 === '立绘' && item?.状态 === 'success' && 获取图片展示地址(item));
    return 获取图片展示地址(avatar) || 获取图片展示地址(portrait) || 获取图片资源文本地址(person?.头像图片URL);
};
