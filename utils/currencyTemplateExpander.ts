import type {
  QualityTemplate,
  TransformDefinition,
  TransformBatchConfig,
  UnitDefinition,
} from '../models/system';

export function 展开品质模板(
  template: QualityTemplate
): Record<string, UnitDefinition> {
  const units: Record<string, UnitDefinition> = {};

  template.qualities.forEach((quality, index) => {
    const unitId = `${quality}${template.baseUnit}`;

    units[unitId] = {
      displayName: unitId,
      displayOrder: index + 1,
      inMarket: template.inMarket ?? true,
      excludeFromValuation: template.excludeFromValuation ?? (template.inMarket === false),
      qualityUpgradeTo: index < template.qualities.length - 1
        ? `${template.qualities[index + 1]}${template.baseUnit}`
        : undefined,
      qualityUpgradeRatio: template.qualityUpgradeRatio,
    };
  });

  return units;
}

export function 展开批量转化(
  sourceTemplate: QualityTemplate,
  config: TransformBatchConfig
): TransformDefinition[] {
  const transforms: TransformDefinition[] = [];

  if (config.autoMapQualities && config.targetQualityTemplate) {
    const targetQualities = config.targetQualityTemplate.qualities;

    sourceTemplate.qualities.forEach((quality, index) => {
      const targetUnit = index < targetQualities.length
        ? `${targetQualities[index]}${config.targetQualityTemplate!.baseUnit}`
        : undefined;

      if (targetUnit) {
        transforms.push({
          fromUnit: `${quality}${sourceTemplate.baseUnit}`,
          toUnit: targetUnit,
          ratio: config.ratio,
          process: config.process,
        });
      }
    });
  }

  else if (config.qualityMapping) {
    sourceTemplate.qualities.forEach(quality => {
      const targetUnit = config.qualityMapping![quality];

      if (!targetUnit) {
        console.warn(`[品质转化] ${quality}${sourceTemplate.baseUnit} 缺少映射，跳过`);
        return;
      }

      transforms.push({
        fromUnit: `${quality}${sourceTemplate.baseUnit}`,
        toUnit: targetUnit,
        ratio: config.ratio,
        process: config.process,
      });
    });
  }

  return transforms;
}
