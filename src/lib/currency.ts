import { CurrencyRate } from '../types';

/**
 * Currency and Safe Monetary Arithmetic Utility for Indian Rupee (INR - ₹)
 * plus Live Multi-Currency FX Engine (Cashew signature feature)
 */

export const CURRENCY_RATES: Record<string, CurrencyRate> = {
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateToINR: 1, flag: '🇮🇳' },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', rateToINR: 86.85, flag: '🇺🇸' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', rateToINR: 92.40, flag: '🇪🇺' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', rateToINR: 108.65, flag: '🇬🇧' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rateToINR: 23.65, flag: '🇦🇪' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rateToINR: 64.50, flag: '🇸🇬' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rateToINR: 63.20, flag: '🇨🇦' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateToINR: 56.40, flag: '🇦🇺' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateToINR: 0.58, flag: '🇯🇵' },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', rateToINR: 23.15, flag: '🇸🇦' },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', rateToINR: 2.45, flag: '🇹🇭' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rateToINR: 98.20, flag: '🇨🇭' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rateToINR: 11.95, flag: '🇨🇳' },
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rateToINR: 19.50, flag: '🇲🇾' },
  QAR: { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR', rateToINR: 23.85, flag: '🇶🇦' },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', rateToINR: 282.50, flag: '🇰🇼' },
  OMR: { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', rateToINR: 225.80, flag: '🇴🇲' },
  BHD: { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', rateToINR: 230.40, flag: '🇧🇭' },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rateToINR: 51.20, flag: '🇳🇿' },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩', rateToINR: 0.063, flag: '🇰🇷' },
  IDR: { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', rateToINR: 0.0054, flag: '🇮🇩' },
  TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rateToINR: 2.50, flag: '🇹🇷' },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rateToINR: 15.20, flag: '🇧🇷' },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', rateToINR: 4.75, flag: '🇿🇦' },
  RUB: { code: 'RUB', name: 'Russian Ruble', symbol: '₽', rateToINR: 0.94, flag: '🇷🇺' },
};

/**
 * Convert an amount from foreign currency to base INR, or between any two currencies
 */
export function convertCurrency(amount: number, fromCode: string, toCode: string = 'INR'): number {
  if (!amount || isNaN(amount)) return 0;
  const fromRate = CURRENCY_RATES[fromCode]?.rateToINR || 1;
  const toRate = CURRENCY_RATES[toCode]?.rateToINR || 1;
  
  // First convert to INR, then from INR to target currency
  const inINR = amount * fromRate;
  const targetAmount = inINR / toRate;
  return Math.round(targetAmount * 100) / 100;
}

/**
 * Format any currency with its native symbol
 */
export function formatForeignCurrency(amount: number, currencyCode: string = 'INR'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${currencyCode} 0`;
  }
  if (currencyCode === 'INR') {
    return formatINR(amount);
  }
  const curr = CURRENCY_RATES[currencyCode];
  const symbol = curr?.symbol || currencyCode;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

/**
 * Format a number to Indian numbering system (e.g. ₹1,25,000 or -₹5,400.50)
 */
export function formatINR(amount: number, showSign = false, hideDecimalsIfZero = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const hasDecimals = absAmount % 1 !== 0;
  const fixedString = (hideDecimalsIfZero && !hasDecimals) 
    ? Math.round(absAmount).toString() 
    : absAmount.toFixed(2);
  
  const [integerPart, decimalPart] = fixedString.split('.');
  
  // Format integer part using Indian grouping (last 3 digits, then pairs of 2 digits)
  let formattedInteger = '';
  if (integerPart.length <= 3) {
    formattedInteger = integerPart;
  } else {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherDigits = integerPart.substring(0, integerPart.length - 3);
    // Split otherDigits into pairs from right to left
    const paired = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInteger = `${paired},${lastThree}`;
  }

  const formattedValue = decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;

  if (isNegative) {
    return `-₹${formattedValue}`;
  }
  if (showSign && amount > 0) {
    return `+₹${formattedValue}`;
  }
  return `₹${formattedValue}`;
}

/**
 * Format compact INR for small badges or graphs (e.g. ₹1.5L, ₹2.3Cr, ₹45K)
 */
export function formatCompactINR(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (abs >= 10000000) {
    // Crores
    return `${sign}₹${(abs / 10000000).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  }
  if (abs >= 100000) {
    // Lakhs
    return `${sign}₹${(abs / 100000).toFixed(2).replace(/\.?0+$/, '')} L`;
  }
  if (abs >= 1000) {
    // Thousands
    return `${sign}₹${(abs / 1000).toFixed(1).replace(/\.?0+$/, '')} k`;
  }
  return `${sign}₹${abs}`;
}

/**
 * Safe currency arithmetic using integer paise representation
 */
export function safeAdd(a: number, b: number): number {
  const aPaise = Math.round((a || 0) * 100);
  const bPaise = Math.round((b || 0) * 100);
  return (aPaise + bPaise) / 100;
}

export function safeSubtract(a: number, b: number): number {
  const aPaise = Math.round((a || 0) * 100);
  const bPaise = Math.round((b || 0) * 100);
  return (aPaise - bPaise) / 100;
}

export function safeMultiply(amount: number, multiplier: number): number {
  const paise = Math.round((amount || 0) * 100);
  return Math.round(paise * multiplier) / 100;
}

/**
 * Calculate Monthly EMI using standard formula:
 * EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
 */
export function calculateEMI(principal: number, annualRatePercent: number, tenureMonths: number): {
  monthlyEMI: number;
  totalInterest: number;
  totalPayment: number;
} {
  if (tenureMonths <= 0 || principal <= 0) {
    return { monthlyEMI: 0, totalInterest: 0, totalPayment: 0 };
  }
  if (annualRatePercent <= 0) {
    const monthlyEMI = Math.round(principal / tenureMonths);
    return { monthlyEMI, totalInterest: 0, totalPayment: principal };
  }

  const monthlyRate = annualRatePercent / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const monthlyEMI = Math.round((principal * monthlyRate * factor) / (factor - 1));
  const totalPayment = monthlyEMI * tenureMonths;
  const totalInterest = Math.max(0, totalPayment - principal);

  return {
    monthlyEMI,
    totalInterest,
    totalPayment,
  };
}
