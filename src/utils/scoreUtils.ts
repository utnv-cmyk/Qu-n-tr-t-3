/**
 * Utility functions for score formatting and parsing across the application.
 */

export interface FormatScoreOptions {
  /** Include '+' for positive numbers. Defaults to true. */
  showSign?: boolean;
  /** Unit to append, e.g. 'đ' or ' điểm'. Defaults to 'đ'. */
  unit?: string;
  /** Decimal places limit (max 2). Defaults to 2. */
  maxDecimals?: number;
}

/**
 * Formats a score with uniform rules:
 * - Positive: "+1.75đ", "+1.5đ", "+1đ"
 * - Negative: "-1.75đ", "-1.5đ", "-1đ" (strictly single minus sign, never "+-")
 * - Zero: "0đ" (never "+0đ" or "-0đ")
 * - Trims trailing zeros: "1.50" -> "1.5", "1.00" -> "1"
 * - Uses dot '.' as uniform decimal separator
 */
export function formatScore(
  value: number | string | null | undefined,
  options?: FormatScoreOptions
): string {
  const showSign = options?.showSign ?? true;
  const unit = options?.unit ?? 'đ';

  if (value === null || value === undefined || value === '') {
    return `0${unit}`;
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) {
    return `0${unit}`;
  }

  // Round to max 2 decimals to prevent floating point anomalies like 1.7500000000000002
  const rounded = Math.round(num * 100) / 100;

  if (rounded === 0 || Object.is(rounded, -0)) {
    return `0${unit}`;
  }

  // Format magnitude without trailing zeros
  const absVal = Math.abs(rounded);
  // toString on rounded number already drops unnecessary trailing zeros in JS (e.g. 1.5 -> "1.5", 1 -> "1")
  const absFormatted = absVal.toString();

  if (rounded > 0) {
    return showSign ? `+${absFormatted}${unit}` : `${absFormatted}${unit}`;
  } else {
    return `-${absFormatted}${unit}`;
  }
}

/**
 * Formats an unsigned point amount (e.g. for buttons or positive magnitudes):
 * - 0.25 -> "0.25đ"
 * - 0.5 -> "0.5đ"
 * - 0.75 -> "0.75đ"
 * - 1.0 -> "1đ"
 * - 1.25 -> "1.25đ"
 */
export function formatScoreWithoutSign(
  value: number | string | null | undefined,
  unit: string = 'đ'
): string {
  return formatScore(value, { showSign: false, unit });
}

export interface ParseScoreOptions {
  /** If true, rounds to nearest multiple of 0.25 */
  roundToQuarter?: boolean;
  min?: number;
  max?: number;
  defaultValue?: number;
}

/**
 * Parses user input into a validated numeric score:
 * - Accepts both comma and dot ("0,25" -> 0.25, "1.5" -> 1.5)
 * - Strips optional 'đ' or whitespace
 * - Optionally snaps to nearest 0.25 interval
 * - Rejects non-numeric characters gracefully with fallback to defaultValue or 0
 */
export function parseScore(
  input: string | number | null | undefined,
  options?: ParseScoreOptions
): number {
  const defaultValue = options?.defaultValue ?? 0;
  if (input === null || input === undefined) return defaultValue;

  let str = String(input).trim();
  if (!str) return defaultValue;

  // Replace comma with dot
  str = str.replace(',', '.');
  // Strip 'đ', 'Đ', 'diem', '+' and spaces
  str = str.replace(/[đĐ+a-zA-Z\s]/g, '');

  const val = parseFloat(str);
  if (isNaN(val)) return defaultValue;

  let result = val;
  if (options?.roundToQuarter) {
    result = Math.round(result * 4) / 4;
  }

  // Round to max 2 decimals
  result = Math.round(result * 100) / 100;

  if (options?.min !== undefined && result < options.min) {
    result = options.min;
  }
  if (options?.max !== undefined && result > options.max) {
    result = options.max;
  }

  return result;
}
