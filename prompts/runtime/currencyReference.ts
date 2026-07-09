import type { ExpandedCurrencySystem, UnitDefinition, TransformDefinition, ExchangeRatePolicies } from '../../models/system';

function 提取品质升级链(units: Record<string, UnitDefinition>): Array<{ from: string; to: string; ratio: number }> {
  return Object.entries(units)
    .filter(([_, unit]) => unit.qualityUpgradeTo)
    .map(([id, unit]) => ({
      from: id,
      to: unit.qualityUpgradeTo!,
      ratio: unit.qualityUpgradeRatio ?? 10,
    }));
}

export function 构建货币参考注入(expandedSystem: ExpandedCurrencySystem): string {
  let text = '【货币使用规则】\n';
  text += '- 货币类物品（类型为 `货币:*`）的价值=数量，单位以物品自身名称为准\n';
  text += '- 非货币物品在特定经济域中的价值允许为 0\n';
  text += '- 非同种货币之间不折算，价值字段只表达物品在原生经济域中的量级\n';
  text += '- 兑换通过叙事执行\n\n';

  for (const [systemId, system] of Object.entries(expandedSystem.systems)) {
    const upgradeChains = 提取品质升级链(system.units);
    if (upgradeChains.length > 0) {
      text += `【${system.displayName}品质升级参考】\n`;
      upgradeChains.forEach(chain => {
        text += `${chain.from} → ${chain.to}（${chain.ratio}:1）\n`;
      });
      text += '\n';
    }
  }

  if (expandedSystem.transforms && expandedSystem.transforms.length > 0) {
    text += '【材料转化参考】\n';
    expandedSystem.transforms.forEach(t => {
      const processDesc = t.process ? `（${t.process}）` : '';
      text += `${t.fromUnit} ${t.ratio}:1 → ${t.toUnit}${processDesc}\n`;
    });
    text += '\n';
  }

  return text;
}

export function 构建货币比例参考(expandedSystem: ExpandedCurrencySystem): string {
  let text = '';

  // 体系内换算
  for (const [systemId, system] of Object.entries(expandedSystem.systems)) {
    const upgradeChains = 提取品质升级链(system.units);
    if (upgradeChains.length > 0) {
      text += `【${system.displayName}体系内换算】\n`;
      upgradeChains.forEach(chain => {
        const fromUnit = system.units[chain.from];
        const toUnit = system.units[chain.to];
        if (fromUnit && toUnit) {
          text += `${chain.ratio} ${fromUnit.displayName} = 1 ${toUnit.displayName}\n`;
        }
      });
      text += '\n';
    }
  }

  // 材料转化
  if (expandedSystem.transforms && expandedSystem.transforms.length > 0) {
    text += '【材料转化】\n';
    expandedSystem.transforms.forEach(t => {
      text += `${t.fromUnit} → ${t.toUnit}: ${t.ratio}:1\n`;
    });
    text += '\n';
  }

  // 体系间汇率策略
  if (expandedSystem.validatedPolicies && Object.keys(expandedSystem.validatedPolicies).length > 0) {
    text += '【体系间汇率策略】\n';
    for (const [policyId, policy] of Object.entries(expandedSystem.validatedPolicies)) {
      if (policy.type === 'fixed') {
        text += `${policy.fromUnit} → ${policy.toUnit}: 固定 ${policy.fixedRate}\n`;
      } else if (policy.type === 'range') {
        text += `${policy.fromUnit} → ${policy.toUnit}: 范围 ${policy.minRate}-${policy.maxRate}\n`;
      }
    }
  }

  return text;
}

export function 构建当前地点汇率快照(
  当前地点名称: string,
  层级列表: any[],
  policies: ExchangeRatePolicies
): string {
  if (!当前地点名称 || !Array.isArray(层级列表) || !policies || Object.keys(policies).length === 0) return '';

  const 当前节点 = 层级列表.find((n: any) => n.名称 === 当前地点名称);
  if (!当前节点?.汇率 || Object.keys(当前节点.汇率).length === 0) return '';

  let text = '【当前地点汇率】\n';
  text += `${当前地点名称}（${当前节点.层级}）\n`;

  let hasValidRate = false;
  for (const [policyId, rate] of Object.entries(当前节点.汇率)) {
    const policy = policies[policyId];
    if (policy) {
      text += `${policy.fromUnit} → ${policy.toUnit}: ${rate}`;
      if (policy.description) {
        text += `（${policy.description}）`;
      }
      text += '\n';
      hasValidRate = true;
    }
  }

  return hasValidRate ? text : '';
}

export function 构建货币快照(
  货币桶: any,
  expandedSystem: ExpandedCurrencySystem
): Record<string, string> {
  if (!货币桶 || typeof 货币桶 !== 'object') return {};

  const snapshot: Record<string, string> = {};

  for (const [systemId, system] of Object.entries(expandedSystem.systems)) {
    const systemUnits = 货币桶[systemId];
    if (!systemUnits || typeof systemUnits !== 'object') continue;

    const parts: string[] = [];
    const sortedUnits = Object.entries(system.units).sort(([, a], [, b]) => (b.displayOrder || 0) - (a.displayOrder || 0));

    for (const [unitId, unit] of sortedUnits) {
      const amount = systemUnits[unitId] ?? 0;
      if (amount > 0) {
        parts.push(`${amount} ${unit.displayName}`);
      }
    }

    if (parts.length > 0) {
      snapshot[systemId] = parts.join(' + ');
    }
  }

  return snapshot;
}
