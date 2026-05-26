export const E2E_PLAYER_NAME = '红楼遗梦';
export const E2E_PARTNER_NAME = '青霜秘档';
export const E2E_CNB_USERNAME = '小号';

const DB_NAME = 'WuxiaGameDB';
const DB_VERSION = 3;

const now = () => Date.now();

const putSetting = (db, key, value) => new Promise((resolve, reject) => {
  const tx = db.transaction('settings', 'readwrite');
  tx.objectStore('settings').put({
    key,
    value,
    version: 2,
    updatedAt: now()
  });
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
});

const openDb = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onerror = () => reject(req.error);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains('saves')) db.createObjectStore('saves', { keyPath: 'id', autoIncrement: true });
    if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
    if (!db.objectStoreNames.contains('save_summaries')) db.createObjectStore('save_summaries', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('image_assets')) db.createObjectStore('image_assets', { keyPath: 'id' });
  };
  req.onsuccess = () => resolve(req.result);
});

const normalizeUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const findSmallAccountBackend = async (registryBaseUrl, connectToken = '') => {
  const base = normalizeUrl(registryBaseUrl || window.location.origin);
  const url = new URL(base.includes('/api/image-backend/cnb-sync') ? base : `${base}/api/image-backend/cnb-sync`);
  url.searchParams.set('backendType', 'comfyui');
  if (connectToken) url.searchParams.set('connectToken', connectToken);
  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`CNB backend registry failed: HTTP ${response.status}`);
  const payload = await response.json();
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items.find((item) => (
    item
    && String(item.customerId || item.label || item.workspace || '').includes(E2E_CNB_USERNAME)
    && item.url
  )) || null;
};

export const preseedNovelInjectionE2E = async (options = {}) => {
  localStorage.setItem('moranjianghu.releaseNotesSuppressDate', new Date().toISOString().slice(0, 10));
  localStorage.setItem('moranjianghu.cloudPlay.riskAcknowledged.v1', 'true');
  localStorage.setItem('moranjianghu.cloudPlay.objectStorageMode.v1', 'object');

  const objectStorage = {
    endpoint: options.objectStorage?.endpoint || 'https://s3.hi168.com',
    bucket: options.objectStorage?.bucket || '',
    accessKey: options.objectStorage?.accessKey || '',
    secretKey: options.objectStorage?.secretKey || '',
    username: options.objectStorage?.username || E2E_PLAYER_NAME,
    prefix: options.objectStorage?.prefix || 'MoRanJiangHu'
  };

  const cnbBackend = options.cnbBackend || await findSmallAccountBackend(
    options.registryBaseUrl || window.location.origin,
    options.connectToken || ''
  ).catch(() => null);
  const cnbBackendUrl = normalizeUrl(cnbBackend?.url || options.cnbBackendUrl || '');
  const cnbBackendId = cnbBackend?.id || (cnbBackendUrl ? 'e2e-cnb-small-account' : '');

  const apiSettings = {
    activeConfigId: 'e2e-main',
    configs: [{
      id: 'e2e-main',
      名称: 'E2E 主剧情接口',
      供应商: 'openai_compatible',
      兼容方案: 'custom',
      协议覆盖: 'openai',
      baseUrl: options.aiBaseUrl || 'https://example.invalid/v1',
      apiKey: options.aiApiKey || 'e2e-placeholder',
      model: options.aiModel || 'e2e-model',
      maxTokens: 8192,
      temperature: 0.7,
      createdAt: now(),
      updatedAt: now()
    }],
    功能模型占位: {
      主剧情使用模型: options.aiModel || 'e2e-model',
      小说拆分功能启用: true,
      小说拆分主剧情注入: true,
      小说拆分规划分析注入: true,
      小说拆分世界演变注入: true,
      小说拆分主剧情保留原文注入: true,
      小说拆分主剧情字数优化: false,
      小说拆分主剧情注入上限: 80,
      小说拆分详细注入上限: 4000,
      文生图功能启用: Boolean(cnbBackendUrl),
      文生图后端类型: 'comfyui',
      文生图模型使用模型: options.imageModel || 'comfyui',
      文生图模型API地址: cnbBackendUrl,
      文生图模型API密钥: '',
      图片后端注册表地址: options.registryBaseUrl || '',
      当前图片后端发现ID: cnbBackendId,
      使用默认ComfyUI工作流: true,
      NSFW生图独立接口启用: false
    }
  };

  const novelDataset = {
    id: 'e2e_novel_original_injection',
    标题: '端到端小说注入数据集',
    作品名: '端到端小说注入数据集',
    来源类型: 'txt',
    schemaVersion: 9,
    原始文本长度: 78,
    原始文本: '红楼遗梦，70多万字。青霜秘档在旧楼灯影下翻开，原文风格需要保留。',
    原始文本摘要: '端到端测试用原文。',
    总章节数: 1,
    章节列表: [],
    分段模式: 'single_chapter',
    每批章数: 1,
    默认时间线起点: '0001:01:01:08:00',
    是否识别原著时间线: false,
    激活注入: true,
    当前阶段概括: '',
    核心角色摘要: [],
    核心角色: [],
    角色档案: [],
    势力档案: [],
    地图地点档案: [],
    物品档案: [],
    世界观规则: [],
    世界边界规则: [],
    人物关系: [],
    势力关系: [],
    伏笔线索: [],
    回收点: [],
    章节节奏: [],
    注入树: [],
    分段列表: [{
      id: 'e2e_segment_original_injection',
      数据集ID: 'e2e_novel_original_injection',
      组号: 1,
      标题: '第一章 红楼遗梦',
      章节范围: '第1章',
      章节标题: ['第一章 红楼遗梦'],
      是否开局组: true,
      起始章序号: 1,
      结束章序号: 1,
      启用注入: true,
      原文内容: '红楼遗梦，70多万字。青霜秘档在旧楼灯影下翻开，原文风格需要保留。',
      字数: 78,
      原文摘要: '青霜秘档在旧楼灯影下翻开。',
      本组概括: '主角接触青霜秘档。',
      开局已成立事实: [],
      前组延续事实: [],
      本组结束状态: [],
      给下一组参考: [],
      原著硬约束: [],
      可提前铺垫: [],
      关键事件: [],
      角色推进: [],
      登场角色: [E2E_PLAYER_NAME, E2E_PARTNER_NAME],
      角色档案: [],
      势力档案: [],
      地图地点档案: [],
      物品档案: [],
      世界观规则: [],
      世界边界规则: [],
      人物关系: [],
      势力关系: [],
      伏笔线索: [],
      回收点: [],
      章节节奏: [],
      时间线: [],
      时间线起点: '',
      时间线终点: '',
      处理状态: '已完成',
      最近错误: '',
      createdAt: now(),
      updatedAt: now()
    }],
    createdAt: now(),
    updatedAt: now()
  };

  const db = await openDb();
  await putSetting(db, 'object_storage_sync_settings', objectStorage);
  await putSetting(db, 'api_settings', apiSettings);
  await putSetting(db, 'novel_decomposition_datasets', [novelDataset]);
  await putSetting(db, 'novel_decomposition_snapshots', []);
  await putSetting(db, 'game_settings', {
    字数要求: 1500,
    字数不足处理方式: '仅提示',
    启用标签检测完整性: true,
    启用标签修复: true
  });
  await putSetting(db, 'memory_settings', {
    短期记忆阈值: 30,
    中期记忆阈值: 50,
    重要角色关键记忆条数N: 20,
    NPC记忆总结阈值: 20,
    即时消息上传条数N: 10
  });

  return {
    playerName: E2E_PLAYER_NAME,
    partnerName: E2E_PARTNER_NAME,
    objectStorageConfigured: Boolean(objectStorage.endpoint && objectStorage.bucket),
    cnbUsername: E2E_CNB_USERNAME,
    cnbBackendUrl,
    cnbBackendId
  };
};
