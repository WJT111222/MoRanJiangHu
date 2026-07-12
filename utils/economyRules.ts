import type { 地图层级结构 } from '../models/world';
import type { ExchangeRatePolicies, ExchangeRatePolicy } from '../models/system';
import { 获取展开货币系统 } from './apiConfig';
import { 地图层级名列表 } from './mapLayerNames';

// 与 地图层级名列表 顺序对应的默认时效（回合）
const 默认时效秒数 = [1000, 500, 200, 100, 50, 50] as const;
const 默认时效映射: Record<string, number> = Object.fromEntries(
  地图层级名列表.map((层, i) => [层, 默认时效秒数[i]]),
);

const 每月天数 = 31;
const 每年天数 = 12 * 每月天数;

export function 获取汇率时效(层级: string, policy?: ExchangeRatePolicy): number {
  return policy?.expireByLayer?.[层级]
    ?? 默认时效映射[层级]
    ?? 100;
}

export function 更新地点在场时间(
  层级列表: 地图层级结构[],
  当前节点ID: string,
  当前时间: string
): void {
  const visited = new Set<string>();

  function 递归更新(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = 层级列表.find(n => n.ID === nodeId);
    if (!node) return;

    node.汇率最后在场时间 = 当前时间;

    if (node.父级ID && node.父级ID !== nodeId) {
      递归更新(node.父级ID);
    }
  }

  递归更新(当前节点ID);
}

export function 获取节点到根路径(
  层级列表: 地图层级结构[],
  当前节点ID: string
): 地图层级结构[] {
  const path: 地图层级结构[] = [];
  const visited = new Set<string>();

  let currentId: string | undefined = 当前节点ID;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const node = 层级列表.find(n => n.ID === currentId);
    if (!node) break;
    path.push(node);
    currentId = node.父级ID && node.父级ID !== node.ID ? node.父级ID : undefined;
  }

  return path;
}

export function 是否汇率过期(
  node: 地图层级结构,
  policyId: string,
  当前时间: string,
  policies: ExchangeRatePolicies
): boolean {
  const policy = policies[policyId];
  if (!policy) return false;
  if (policy.type === 'fixed') return false;

  const 最后在场 = node.汇率最后在场时间;
  if (!最后在场) return true;

  const 离开回合数 = 计算回合差(最后在场, 当前时间);
  const 时效 = 获取汇率时效(node.层级, policy);

  return 离开回合数 > 时效;
}

export function 补充寰宇固定汇率(
  寰宇节点: 地图层级结构,
  policies: ExchangeRatePolicies,
  当前时间: string
): void {
  if (!policies) return;

  for (const [policyId, policy] of Object.entries(policies)) {
    if (policy.type === 'fixed' && !寰宇节点.汇率?.[policyId]) {
      寰宇节点.汇率 = 寰宇节点.汇率 || {};
      寰宇节点.汇率[policyId] = policy.fixedRate!;
      寰宇节点.汇率生成时间 = 当前时间;
    }
  }
}

export function 检查汇率(
    层级列表: any[],
    当前节点ID: string,
    当前时间: string,
    运行时配置: any,
    worldBuffer?: any
): void {
    if (!Array.isArray(层级列表) || !当前节点ID) return;
    const expandedSystem = 获取展开货币系统(运行时配置);
    if (!expandedSystem?.validatedPolicies) return;
    const policies = expandedSystem.validatedPolicies;

    const 寰宇节点 = 层级列表.find((n: any) => n.层级 === '寰宇');
    if (寰宇节点) {
        补充寰宇固定汇率(寰宇节点, policies, 当前时间);
    }

    for (const node of 层级列表) {
        if (!node.汇率) continue;
        for (const policyId of Object.keys(node.汇率)) {
            if (是否汇率过期(node, policyId, 当前时间, policies)) {
                delete node.汇率[policyId];
            }
        }
    }

    const 层级链 = 获取节点到根路径(层级列表, 当前节点ID);
    const 待生成: Array<{ node: any; policyId: string; reason: string }> = [];

    for (const node of 层级链) {
        for (const policyId of Object.keys(policies)) {
            if (是否汇率过期(node, policyId, 当前时间, policies)) {
                const policy = policies[policyId];
                const 历史汇率 = node.汇率?.[policyId];
                const reason = 历史汇率 != null
                    ? `已过期（上次汇率 ${历史汇率}）`
                    : '首次到达';
                待生成.push({ node, policyId, reason });
            }
        }
    }

    // 在检查完需要生成的汇率后，再更新在场时间
    更新地点在场时间(层级列表, 当前节点ID, 当前时间);

    if (待生成.length > 0) {
        const promptBlock = 构建汇率生成提示(待生成, 层级链, 当前时间, policies);
        if (worldBuffer) {
            worldBuffer._汇率生成任务 = promptBlock;
        }
    }
}

export function 构建汇率生成提示(
  待生成列表: Array<{ node: 地图层级结构; policyId: string; reason: string }>,
  层级链: 地图层级结构[],
  当前时间: string,
  policies: ExchangeRatePolicies
): string {
  if (待生成列表.length === 0) return '';

  let text = '\n【需生成汇率】\n';
  text += '以下地点汇率已过期或不存在，请按策略生成：\n';

  for (const { node, policyId, reason } of 待生成列表) {
    const policy = policies[policyId];
    if (!policy) continue;

    text += `\n地点：${node.名称}（${node.层级}）\n`;
    text += `  策略：${policyId}（${policy.description ?? ''}）`;

    if (policy.type === 'range') {
      text += ` 范围 ${policy.minRate}~${policy.maxRate}`;
    }
    text += '\n';

    if (reason) {
      text += `  原因：${reason}\n`;
    }

    const 历史汇率 = node.汇率?.[policyId];
    if (历史汇率 != null) {
      text += `  历史汇率：${历史汇率}\n`;
    }

    const 邻近参考 = 层级链
      .filter(n => n.层级 === node.层级 && n.ID !== node.ID && n.汇率?.[policyId])
      .map(n => `${n.名称}=${n.汇率![policyId]}`)
      .join(', ');
    if (邻近参考) {
      text += `  邻近参考：${邻近参考}\n`;
    }
  }

  text += '\n写入格式：\n';
  text += '  世界.地图层级.{层级}/{名称}.汇率.{policyId} = {数值}\n';
  text += '  世界.地图层级.{层级}/{名称}.汇率生成时间 = "{当前时间}"\n';
  text += '  世界.地图层级.{层级}/{名称}.汇率变更原因 = "{原因}"\n';

  return text;
}

function 计算回合差(时间A: string, 时间B: string): number {
  const parseTime = (t: string): number | null => {
    const parts = t.split(':').map(Number);
    // 畸形时间串（非 年:月:日:时:分 或含非数字）按已过期处理，避免 NaN 使费率永不过期
    if (parts.length !== 5 || parts.some((n) => !Number.isFinite(n))) return null;
    return (((((parts[0] - 1) * 12) + (parts[1] - 1)) * 每月天数 + (parts[2] - 1)) * 24 + parts[3]) * 60 + parts[4];
  };
  const a = parseTime(时间A);
  const b = parseTime(时间B);
  if (a === null || b === null) return Infinity;
  return Math.abs(b - a);
}
