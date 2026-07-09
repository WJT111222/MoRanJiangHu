import type {
  QualityTemplate,
  TransformDefinition,
  TransformBatchConfig,
  UnitDefinition,
  ExpandedCurrencySystem,
  ExpandedSystemConfig,
  ExchangeRatePolicies,
  ExchangeRatePolicy,
} from '../models/system';
import { 展开品质模板, 展开批量转化 } from './currencyTemplateExpander';

export function 查找单位所属体系(
  unitId: string,
  systems: Record<string, ExpandedSystemConfig>
): ExpandedSystemConfig | undefined {
  for (const system of Object.values(systems)) {
    if (system.units[unitId]) {
      return system;
    }
  }
  return undefined;
}

export interface 汇率配置错误 {
  policyId: string;
  message: string;
}

export function 校验汇率配置(
  systems: Record<string, ExpandedSystemConfig>,
  policies: ExchangeRatePolicies
): 汇率配置错误[] {
  const errors: 汇率配置错误[] = [];

  for (const [policyId, policy] of Object.entries(policies)) {
    if (policy.fromUnit === policy.toUnit) {
      errors.push({ policyId, message: `fromUnit 和 toUnit 不能相同 (${policy.fromUnit})` });
      continue;
    }

    const fromSystem = 查找单位所属体系(policy.fromUnit, systems);
    const toSystem = 查找单位所属体系(policy.toUnit, systems);

    if (!fromSystem) {
      errors.push({ policyId, message: `fromUnit "${policy.fromUnit}" 不存在于任何体系` });
      continue;
    }
    if (!toSystem) {
      errors.push({ policyId, message: `toUnit "${policy.toUnit}" 不存在于任何体系` });
      continue;
    }

    if (!fromSystem.exchangeable) {
      errors.push({ policyId, message: `${policy.fromUnit} 所属体系不可兑换 (exchangeable=false)` });
    }
    if (!toSystem.exchangeable) {
      errors.push({ policyId, message: `${policy.toUnit} 所属体系不可兑换 (exchangeable=false)` });
    }

    if (policy.type === 'fixed' && policy.fixedRate == null) {
      errors.push({ policyId, message: 'fixed 类型必须指定 fixedRate' });
    }
    if (policy.type === 'range' && (policy.minRate == null || policy.maxRate == null)) {
      errors.push({ policyId, message: 'range 类型必须指定 minRate 和 maxRate' });
    }
  }

  return errors;
}

export function 加载并展开货币系统(
  config: {
    systems: Record<string, {
      displayName: string;
      displayOrder: number;
      exchangeable: boolean;
      units?: Record<string, UnitDefinition>;
      qualityTemplate?: QualityTemplate;
      transforms?: TransformDefinition[];
      transformsTo?: TransformBatchConfig;
    }>;
  },
  exchangeRatePolicies?: ExchangeRatePolicies
): ExpandedCurrencySystem {
  const expanded: ExpandedCurrencySystem = {
    systems: {},
    transforms: [],
  };

  for (const [systemId, system] of Object.entries(config.systems)) {
    let units = { ...(system.units ?? {}) };

    if (system.qualityTemplate) {
      const templateUnits = 展开品质模板(system.qualityTemplate);
      units = { ...units, ...templateUnits };
    }

    expanded.systems[systemId] = {
      displayName: system.displayName,
      displayOrder: system.displayOrder,
      exchangeable: system.exchangeable,
      units,
      qualityTemplate: system.qualityTemplate,
      transforms: system.transforms,
      transformsTo: system.transformsTo,
    };

    if (system.transformsTo && system.qualityTemplate) {
      const batchTransforms = 展开批量转化(system.qualityTemplate, system.transformsTo);
      const manualFromUnits = new Set((system.transforms ?? []).map(t => t.fromUnit));
      const filteredBatch = batchTransforms.filter(t => !manualFromUnits.has(t.fromUnit));
      expanded.transforms.push(...filteredBatch);
    }

    if (system.transforms) {
      expanded.transforms.push(...system.transforms);
    }
  }

  if (exchangeRatePolicies) {
    const errors = 校验汇率配置(expanded.systems, exchangeRatePolicies);
    if (errors.length > 0) {
      console.error('[货币系统] 汇率配置错误:', errors);
      const validPolicies: ExchangeRatePolicies = {};
      const errorPolicyIds = new Set(errors.map(e => e.policyId));
      for (const [id, policy] of Object.entries(exchangeRatePolicies)) {
        if (!errorPolicyIds.has(id)) {
          validPolicies[id] = policy;
        }
      }
      expanded.validatedPolicies = validPolicies;
    } else {
      expanded.validatedPolicies = exchangeRatePolicies;
    }
  }

  return expanded;
}
