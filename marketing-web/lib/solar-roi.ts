/**
 * Solar ROI estimator — Ukraine-tuned, deliberately conservative.
 *
 * These are marketing-grade estimates to motivate a consultation, NOT an
 * engineering quote. The model and its constants are intentionally simple and
 * transparent so the numbers are defensible to a customer.
 */

export type BusinessType = 'home' | 'business';

export interface RoiInput {
  /** Average monthly electricity bill, UAH. */
  monthlyBill: number;
  /** Average monthly consumption, kWh. Optional — derived from the bill if absent. */
  monthlyConsumption?: number;
  businessType: BusinessType;
}

export interface RoiResult {
  /** Recommended PV system size, kWp. */
  systemSizeKw: number;
  /** Estimated first-year electricity-cost savings, UAH. */
  annualSavings: number;
  /** Estimated turnkey system cost, UAH. */
  systemCost: number;
  /** Simple payback period, years. */
  paybackYears: number;
  /** Estimated 25-year cumulative savings, UAH (lifetime of panels). */
  lifetimeSavings: number;
  /** Tariff used in the calculation, UAH/kWh. */
  tariff: number;
}

// ── Model constants (Ukraine, 2026) ───────────────────────────────────────────
/** Typical residential tariff, UAH/kWh. */
const HOME_TARIFF = 4.32;
/** Typical small-business/commercial tariff, UAH/kWh. */
const BUSINESS_TARIFF = 6.5;
/** Specific yield: annual kWh produced per installed kWp (central/west Ukraine). */
const SPECIFIC_YIELD = 1050;
/** Turnkey installed cost per kWp, UAH — larger systems get economies of scale. */
const COST_PER_KW_HOME = 38_000;
const COST_PER_KW_BUSINESS = 32_000;
/** Share of generation actually offsetting the bill (self-consumption + net billing). */
const OFFSET_FACTOR = 0.9;
const PANEL_LIFETIME_YEARS = 25;
/** Assumed average annual electricity-price growth over the system lifetime. */
const PRICE_GROWTH = 0.06;

function round(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function computeRoi(input: RoiInput): RoiResult | null {
  const monthlyBill = Number(input.monthlyBill);
  if (!Number.isFinite(monthlyBill) || monthlyBill <= 0) {
    return null;
  }

  const tariff = input.businessType === 'business' ? BUSINESS_TARIFF : HOME_TARIFF;

  // Consumption: use the entered value, else derive it from the bill and tariff.
  const monthlyConsumption =
    input.monthlyConsumption && input.monthlyConsumption > 0
      ? Number(input.monthlyConsumption)
      : monthlyBill / tariff;

  const annualConsumption = monthlyConsumption * 12;

  // Size the array to cover annual consumption.
  let systemSizeKw = round(annualConsumption / SPECIFIC_YIELD, 0.5);
  if (systemSizeKw < 1) systemSizeKw = 1;

  const annualProduction = systemSizeKw * SPECIFIC_YIELD;
  const offsetKwh = Math.min(annualProduction, annualConsumption) * OFFSET_FACTOR;
  const annualSavings = Math.round(offsetKwh * tariff);

  const costPerKw =
    input.businessType === 'business' ? COST_PER_KW_BUSINESS : COST_PER_KW_HOME;
  const systemCost = Math.round(systemSizeKw * costPerKw);

  const paybackYears = annualSavings > 0
    ? Math.round((systemCost / annualSavings) * 10) / 10
    : 0;

  // Lifetime savings with modest tariff growth (geometric series).
  const growthFactor =
    (Math.pow(1 + PRICE_GROWTH, PANEL_LIFETIME_YEARS) - 1) / PRICE_GROWTH;
  const lifetimeSavings = Math.round(annualSavings * growthFactor);

  return {
    systemSizeKw,
    annualSavings,
    systemCost,
    paybackYears,
    lifetimeSavings,
    tariff,
  };
}

/** UAH formatter, no decimals. */
export function formatUah(value: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(value);
}
