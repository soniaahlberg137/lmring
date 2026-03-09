import type { ModelPricingUnit } from '../types';

export function getPricingUnitLabel(unit?: ModelPricingUnit): string {
  switch (unit) {
    case 'seconds':
      return '/ sec';
    case 'requests':
      return '/ req';
    default:
      return '/ M tokens';
  }
}
