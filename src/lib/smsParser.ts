import { TransactionType } from '../types';

export interface ParsedSMSResult {
  amount?: number;
  type: TransactionType;
  merchant?: string;
  accountLast4?: string;
  bankName?: string;
  paymentApp?: string;
  date?: string; // YYYY-MM-DD
  referenceNumber?: string;
  suggestedCategoryId?: string;
  confidence: number; // 0 to 1
  rawText: string;
}

/**
 * Intelligent SMS / UPI / Bank alert parser for Indian banking & fintech notifications.
 * Supports HDFC, SBI, ICICI, Axis, Kotak, IDFC, PNB, Canara, BoB, CRED, GPay, PhonePe, Paytm, etc.
 */
export function parseBankSMS(text: string): ParsedSMSResult | null {
  if (!text || text.trim().length < 10) return null;

  const raw = text.trim();
  const lower = raw.toLowerCase();

  // 1. Detect Transaction Type
  let type: TransactionType = 'EXPENSE';
  if (
    lower.includes('credited') ||
    lower.includes('received') ||
    lower.includes('deposited') ||
    lower.includes('refund') ||
    lower.includes('cashback') ||
    lower.includes('salary') ||
    lower.includes('credit of rs') ||
    lower.includes('cr of rs')
  ) {
    type = 'INCOME';
  } else if (
    lower.includes('debited') ||
    lower.includes('spent') ||
    lower.includes('paid') ||
    lower.includes('sent') ||
    lower.includes('withdrawn') ||
    lower.includes('purchase') ||
    lower.includes('used at') ||
    lower.includes('dr of rs')
  ) {
    type = 'EXPENSE';
  }

  // 2. Extract Amount (Rs., INR, ₹, followed by digits and optional commas/decimals)
  let amount: number | undefined;
  const amountRegexes = [
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:debited by|credited with|spent|paid|vpa|sent)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:amount|for)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)/i,
  ];

  for (const regex of amountRegexes) {
    const match = raw.match(regex);
    if (match && match[1]) {
      const cleanNum = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0 && parsed < 100000000) {
        amount = parsed;
        break;
      }
    }
  }

  // 3. Extract Account or Card Last 4 Digits
  let accountLast4: string | undefined;
  const accRegexes = [
    /(?:a\/c|acct|account|card|ending)\s*(?:no\.?)?\s*(?:xx|x|\*)*(\d{3,4})/i,
    /(?:x|xx|\*)(\d{4})\b/i,
    /(?:debited from|credited to|using)\s*(?:a\/c|card)?\s*(?:xx|x|\*)*(\d{3,4})/i,
  ];

  for (const regex of accRegexes) {
    const match = raw.match(regex);
    if (match && match[1]) {
      accountLast4 = match[1];
      break;
    }
  }

  // 4. Extract Bank Name
  let bankName: string | undefined;
  if (/hdfc/i.test(raw)) bankName = 'HDFC Bank';
  else if (/sbi|state bank/i.test(raw)) bankName = 'State Bank of India';
  else if (/icici/i.test(raw)) bankName = 'ICICI Bank';
  else if (/axis/i.test(raw)) bankName = 'Axis Bank';
  else if (/kotak/i.test(raw)) bankName = 'Kotak Mahindra Bank';
  else if (/idfc/i.test(raw)) bankName = 'IDFC FIRST Bank';
  else if (/pnb|punjab national/i.test(raw)) bankName = 'Punjab National Bank';
  else if (/bob|baroda/i.test(raw)) bankName = 'Bank of Baroda';
  else if (/canara/i.test(raw)) bankName = 'Canara Bank';
  else if (/indusind/i.test(raw)) bankName = 'IndusInd Bank';
  else if (/yes bank/i.test(raw)) bankName = 'YES Bank';
  else if (/federal/i.test(raw)) bankName = 'Federal Bank';
  else if (/rbl/i.test(raw)) bankName = 'RBL Bank';
  else if (/amex|american express/i.test(raw)) bankName = 'American Express';

  // 5. Extract Payment App / Channel
  let paymentApp: string | undefined;
  if (/google pay|gpay|googlepay/i.test(raw)) paymentApp = 'Google Pay';
  else if (/phonepe/i.test(raw)) paymentApp = 'PhonePe';
  else if (/paytm/i.test(raw)) paymentApp = 'Paytm';
  else if (/cred/i.test(raw)) paymentApp = 'CRED';
  else if (/amazon pay|amazonpay/i.test(raw)) paymentApp = 'Amazon Pay';
  else if (/bhim/i.test(raw)) paymentApp = 'BHIM UPI';
  else if (/whatsapp/i.test(raw)) paymentApp = 'WhatsApp Pay';
  else if (/upi/i.test(raw)) paymentApp = 'UPI';

  // 6. Extract Merchant / Payee
  let merchant: string | undefined;
  const merchantRegexes = [
    /(?:to|at|info|vpa|paid to|transferred to|towards)\s+([A-Za-z0-9\s&.'_-]{3,35})(?:\s+on|\s+ref|\s+upi|\s+avl|\s+bal|\s+via|\.|$)/i,
    /(?:info\s*:\s*)([A-Za-z0-9\s&.'_-]{3,35})/i,
    /(?:at\s+)([A-Z0-9\s&.'_-]{3,30})/i,
  ];

  for (const regex of merchantRegexes) {
    const match = raw.match(regex);
    if (match && match[1]) {
      let cand = match[1].trim();
      // Remove trailing noise words
      cand = cand.replace(/\b(on|ref|upi|avl|bal|not|txn|date|time)\b.*$/i, '').trim();
      if (cand.length >= 2 && !/^(a\/c|account|rs|inr|your|dear)$/i.test(cand)) {
        merchant = cand;
        break;
      }
    }
  }

  // 7. Extract Reference Number
  let referenceNumber: string | undefined;
  const refMatch = raw.match(/(?:ref(?:\s*no\.?)?|rrn|txn\s*id|upi\s*ref|utr)\s*(?:is|:)?\s*([A-Za-z0-9]{6,16})/i);
  if (refMatch && refMatch[1]) {
    referenceNumber = refMatch[1];
  }

  // 8. Suggest Category based on merchant or keywords
  let suggestedCategoryId: string | undefined;
  const mLower = (merchant || '').toLowerCase() + ' ' + lower;
  if (/swiggy|zomato|mcdonald|kfc|starbucks|domino|burger|subway|cafe|pizza|restaurant|eatclub/i.test(mLower)) {
    suggestedCategoryId = 'food_dining';
  } else if (/blinkit|zepto|instamart|bigbasket|dmart|supermarket|grocery|milk|vegetable|fruit|nature's basket/i.test(mLower)) {
    suggestedCategoryId = 'groceries';
  } else if (/amazon|flipkart|myntra|zara|h&m|ajio|meesho|nykaa|shopping|cloth/i.test(mLower)) {
    suggestedCategoryId = 'shopping';
  } else if (/uber|ola|rapido|metro|irctc|redbus|flight|indigo|air india|fastag|toll/i.test(mLower)) {
    suggestedCategoryId = 'transport';
  } else if (/petrol|fuel|hpcl|bpcl|iocl|shell|cng|ev charging/i.test(mLower)) {
    suggestedCategoryId = 'fuel_petrol';
  } else if (/electricity|bescom|tneb|airtel|jio|vi\b|broadband|wifi|water bill|gas|cylinder/i.test(mLower)) {
    suggestedCategoryId = 'bills_utilities';
  } else if (/netflix|spotify|prime|hotstar|youtube|gaming|steam|pvr|inox|bookmyshow/i.test(mLower)) {
    suggestedCategoryId = 'subscriptions';
  } else if (/pharmacy|apollo|medplus|1mg|doctor|hospital|clinic|health/i.test(mLower)) {
    suggestedCategoryId = 'health_medical';
  } else if (/cult|gym|fitness|protein|sports/i.test(mLower)) {
    suggestedCategoryId = 'fitness_sports';
  } else if (/salary|bonus|payroll|employer/i.test(mLower)) {
    suggestedCategoryId = 'salary_primary';
  }

  // Calculate confidence score
  let confidence = 0.4;
  if (amount) confidence += 0.3;
  if (merchant) confidence += 0.15;
  if (bankName || accountLast4) confidence += 0.15;

  return {
    amount,
    type,
    merchant,
    accountLast4,
    bankName,
    paymentApp,
    date: new Date().toISOString().substring(0, 10),
    referenceNumber,
    suggestedCategoryId,
    confidence: Math.min(1, confidence),
    rawText: raw,
  };
}
