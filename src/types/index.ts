export type TransactionType =
  | 'EXPENSE'
  | 'INCOME'
  | 'TRANSFER'
  | 'CARD_PAYMENT'
  | 'INVESTMENT_CONTRIBUTION'
  | 'INVESTMENT_WITHDRAWAL'
  | 'LOAN_DISBURSEMENT'
  | 'LOAN_REPAYMENT'
  | 'MONEY_LENT'
  | 'MONEY_LENT_REPAYMENT'
  | 'MONEY_BORROWED'
  | 'MONEY_BORROWED_REPAYMENT'
  | 'REFUND'
  | 'ADJUSTMENT';

export type AccountType =
  | 'SAVINGS'
  | 'CURRENT'
  | 'SALARY'
  | 'CASH'
  | 'WALLET'
  | 'FIXED_DEPOSIT'
  | 'RECURRING_DEPOSIT'
  | 'CREDIT_CARD'
  | 'LOAN'
  | 'INVESTMENT'
  | 'OTHER';

export type InvestmentCategory =
  | 'MUTUAL_FUNDS'
  | 'STOCKS'
  | 'GOLD'
  | 'FIXED_DEPOSIT'
  | 'RECURRING_DEPOSIT'
  | 'PPF'
  | 'PPF_EPF'
  | 'NPS'
  | 'REAL_ESTATE'
  | 'CRYPTO'
  | 'BONDS'
  | 'OTHER';

export type LoanType = 'PERSONAL' | 'HOME' | 'VEHICLE' | 'EDUCATION' | 'OTHER';

export type CardNetwork = 'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX' | 'DINERS' | 'DISCOVER' | 'OTHER';

export type CardTheme =
  | 'midnight'
  | 'carbon'
  | 'gold'
  | 'sapphire'
  | 'emerald'
  | 'ruby'
  | 'sunset'
  | 'platinum'
  | 'amethyst'
  | 'coral'
  | 'ocean'
  | 'rose_gold'
  | 'aurora'
  | 'cyber_neon'
  | 'dark_bronze'
  | 'velvet_wine'
  | 'arctic_silver'
  | 'stealth_matte';

export interface BankCardCatalogItem {
  id?: string;
  name: string;
  issuer: string;
  network: CardNetwork;
  theme: CardTheme | string;
  tier?: string;
  category?: 'Cashback' | 'Travel & Lounge' | 'RuPay UPI' | 'Super Premium' | 'Rewards & Dining' | 'Fuel' | 'Shopping';
  limit: number;
  perks: string;
  statementDay?: number;
  dueDay?: number;
  isPopular?: boolean;
}

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';

export type BudgetRollover = 'NO_ROLLOVER' | 'ROLLOVER_POSITIVE' | 'ROLLOVER_ALL';

export interface Account {
  id: string;
  name: string;
  institution: string; // e.g. "HDFC Bank", "State Bank of India", "Amazon Pay", "Cash"
  type: AccountType;
  openingBalance: number; // in whole paise or rupees (stored in rupees)
  calculatedBalance: number;
  accountNumberLast4?: string;
  icon: string; // Lucide icon name or emoji or image URL
  color: string; // Hex or tailwind color
  accountTheme?: string; // Signature bank theme or custom gradient
  notes?: string;
  isActive: boolean;
  isExcludedFromNetWorth?: boolean;
  isDeleted?: boolean;
  deletedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreditCard {
  id: string;
  name: string; // e.g. "Regalia Gold", "Amazon Pay ICICI"
  issuer: string; // e.g. "HDFC Bank", "ICICI Bank"
  network?: CardNetwork;
  cardTheme?: CardTheme | string;
  cardVariant?: string;
  lastFourDigits: string;
  creditLimit: number;
  openingBalance: number; // initial outstanding amount
  currentOutstanding: number; // calculated from purchases & payments
  statementDate: number; // day of month 1-31
  dueDate: number; // day of month 1-31
  billingCycleDays?: number;
  minimumDue?: number;
  icon: string;
  color: string;
  cardImage?: string;
  notes?: string;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ConvertAccountToCardOptions {
  accountId: string;
  cardName: string;
  issuer: string;
  network?: CardNetwork;
  cardTheme?: CardTheme | string;
  cardVariant?: string;
  lastFourDigits: string;
  creditLimit: number;
  openingBalance?: number; // initial outstanding amount
  statementDate: number; // 1-31
  dueDate: number; // 1-31
  notes?: string;
  migrateTransactions?: boolean; // whether to update past transactions associated with this bank to the new card
  deleteOriginalAccount?: boolean;
}

export interface ConvertCardToAccountOptions {
  cardId: string;
  accountName: string;
  institution: string;
  type: AccountType;
  openingBalance?: number;
  lastFourDigits?: string;
  icon?: string;
  color?: string;
  accountTheme?: string;
  notes?: string;
  migrateTransactions?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'EXPENSE' | 'INCOME' | 'BOTH';
  icon: string;
  color: string;
  subcategories: string[];
  isCustom?: boolean;
  order: number;
}

export interface Merchant {
  id: string;
  name: string;
  defaultCategoryId?: string;
  defaultPaymentAppId?: string;
  defaultAccountId?: string;
  icon?: string;
  transactionCount: number;
  lastUsedAt?: number;
}

export interface PaymentApp {
  id: string;
  name: string; // e.g. "Google Pay", "PhonePe", "Paytm", "BHIM", "Amazon Pay", "CRED"
  icon: string;
  color: string;
  symbol?: string; // Short emblem text e.g. "Fi", "Sl", "Jup", "₹", "UPI"
  gradient?: string; // Custom 3D gradient string
  theme?: string;
  description?: string;
  isCustom?: boolean;
}

export interface SplitItem {
  id: string;
  categoryId: string;
  categoryName?: string;
  amount: number;
  notes?: string;
}

export interface Transaction {
  id: string;
  amount: number; // in Rupees (e.g. 450 or 125000.50)
  type: TransactionType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timestamp: number;
  
  // Categorization & Context
  categoryId?: string;
  categoryName?: string;
  subcategory?: string;
  merchantName?: string;
  merchantId?: string;
  notes?: string;
  tags?: string[];
  receiptUrl?: string; // base64 or local blob URL
  
  // Multi-Currency & Split support (Cashew signature features)
  splits?: SplitItem[];
  originalCurrency?: string; // e.g. "USD", "EUR", "AED"
  originalAmount?: number;
  exchangeRate?: number;
  
  // Accounts & Channels
  accountId?: string; // Primary source account
  accountName?: string;
  toAccountId?: string; // Destination account for transfers / payments
  toAccountName?: string;
  creditCardId?: string; // For credit card purchases/payments
  creditCardName?: string;
  paymentAppId?: string; // "Google Pay", "PhonePe", etc. (metadata channel)
  paymentAppName?: string;
  
  // Relationships
  relatedTransactionId?: string; // e.g. original expense for a REFUND
  refundAmount?: number; // accumulated refunds on this expense
  investmentId?: string;
  loanId?: string;
  loanPrincipalPortion?: number;
  loanInterestPortion?: number;
  debtPersonName?: string; // For Money Lent / Money Borrowed
  debtDueDate?: string;
  isDebtSettled?: boolean;
  goalId?: string; // Link to Savings Goal
  
  // Recurring link
  recurringId?: string;
  recurringName?: string;
  isAutoRecorded?: boolean;
  
  // Meta
  isDeleted?: boolean; // Soft delete / Trash
  deletedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  frequency: RecurrenceFrequency;
  interval?: number; // e.g. 1
  startDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  lastGeneratedDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  categoryId?: string;
  categoryName?: string;
  subcategory?: string;
  accountId?: string;
  accountName?: string;
  creditCardId?: string;
  creditCardName?: string;
  toAccountId?: string;
  toAccountName?: string;
  paymentAppId?: string;
  paymentAppName?: string;
  merchantName?: string;
  autoRecord?: boolean; // automatically creates transaction entry on the relevant date
  isActive: boolean;
  notes?: string;
  tags?: string[];
  isDeleted?: boolean;
  deletedAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface Custom3DEmblem {
  id: string;
  name: string;
  icon: string;
  shape: 'squircle' | 'circle' | 'shield' | 'diamond' | 'hexagon' | 'star';
  theme: string;
  fromColor: string;
  viaColor?: string;
  toColor: string;
  shadowColor: string;
  accentColor: string;
  glow?: boolean;
  texture?: 'gloss' | 'metallic' | 'hologram' | 'glass' | 'neon' | 'matte' | 'crystal';
  tag?: string;
  createdAt: number;
}

export interface SubscriptionCatalogItem {
  id: string;
  name: string;
  tagline: string;
  category: 'OTT & Streaming' | 'Music & Audio' | 'Productivity & AI' | 'Food & Delivery' | 'Gaming' | 'Fitness & Wellness' | 'Cloud & Utilities' | 'News & Reading' | 'News & Learning';
  defaultAmount: number;
  frequency: RecurrenceFrequency;
  icon: string;
  color: string;
  gradient: string;
  popular?: boolean;
  plans?: { name: string; amount: number; frequency: RecurrenceFrequency }[];
}

export interface InvestmentCatalogItem {
  id: string;
  name: string;
  category: InvestmentCategory;
  tagline: string;
  icon: string;
  color: string;
  gradient: string;
  expectedReturn?: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  popular?: boolean;
}

export interface Subscription {
  id: string;
  name: string; // "Netflix", "Spotify", "Amazon Prime", "Gym", "Broadband"
  amount: number;
  frequency: RecurrenceFrequency;
  nextBillingDate: string;
  lastGeneratedDate?: string;
  categoryId?: string;
  categoryName?: string;
  accountId?: string;
  accountName?: string;
  creditCardId?: string;
  creditCardName?: string;
  paymentAppId?: string;
  paymentAppName?: string;
  icon: string;
  color: string;
  isActive: boolean;
  autoRecord?: boolean;
  notes?: string;
  isDeleted?: boolean;
  deletedAt?: number;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  categoryId?: string; // Specific category or null for Total Monthly Budget
  month: string; // "2026-08" or "ALL"
  rolloverType: BudgetRollover;
  rolloverAmount?: number;
  alertThresholdPercent?: number; // e.g. 80%
  color: string;
  isDeleted?: boolean;
  deletedAt?: number;
}

export interface Loan {
  id: string;
  name: string; // "Home Loan - SBI", "Car Loan - HDFC"
  type: LoanType;
  lenderName: string;
  principalAmount: number;
  outstandingPrincipal: number;
  interestRateAnnual: number; // e.g. 8.5 (%)
  tenureMonths: number;
  emiAmount: number;
  startDate: string;
  nextPaymentDate: string;
  linkedAccountId?: string;
  notes?: string;
  createdAt: number;
}

export interface Investment {
  id: string;
  name: string; // "Nifty 50 Index Fund", "HDFC Gold ETF", "SBI FD 3yr"
  category: InvestmentCategory;
  investedAmount: number;
  currentValue: number;
  linkedAccountId?: string;
  purchaseDate: string;
  notes?: string;
  icon?: string;
  color?: string;
  folioNumber?: string;
  units?: number;
  navOrBuyPrice?: number;
  updatedAt: number;
}

export interface DebtRecord {
  id: string;
  type: 'LENT' | 'BORROWED';
  personName: string;
  amount: number;
  remainingAmount: number;
  dueDate?: string;
  notes?: string;
  isSettled: boolean;
  icon?: string;
  color?: string;
  contactNumber?: string;
  createdAt: number;
}

export interface AccountReconciliation {
  id: string;
  accountId: string;
  accountName: string;
  reconciliationDate: string;
  statementBalance: number;
  calculatedBalance: number;
  difference: number;
  status: 'BALANCED' | 'DISCREPANCY' | 'ADJUSTED';
  adjustmentTransactionId?: string;
  notes?: string;
  createdAt: number;
}

export interface AppSettings {
  currencyCode: 'INR';
  currencySymbol: '₹';
  theme: 'light' | 'dark' | 'system';
  isPinEnabled: boolean;
  pinHash?: string;
  autoLockMinutes: number; // 0 = immediate, 1, 5, 15
  isBiometricEnabled: boolean;
  isScreenshotProtectionEnabled: boolean;
  hasCompletedOnboarding: boolean;
  userName?: string;
  hiddenDashboardCards: string[];
  dashboardCardOrder: string[];
  lowBalanceThreshold: number; // e.g. 5000
  notificationPreferences: {
    billReminders: boolean;
    budgetAlerts: boolean;
    largeTransactionThreshold: number;
    monthlySummary: boolean;
  };
}

export interface GoalAllocation {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: 'DEPOSIT' | 'WITHDRAW';
  notes?: string;
  accountId?: string;
  accountName?: string;
  timestamp: number;
}

export interface Goal {
  id: string;
  name: string; // e.g. "Emergency Fund (6 Months)", "MacBook Pro M4", "Goa Trip with Friends", "Down Payment for Flat"
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // YYYY-MM-DD
  category?: string;
  icon: string;
  color: string;
  accountId?: string;
  linkedAccountId?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  allocations: GoalAllocation[];
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
  deletedAt?: number;
}

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateToINR: number; // e.g. USD = 86.50
  flag: string;
}

export interface AppBackupData {
  version: number;
  exportedAt: string;
  accounts: Account[];
  creditCards: CreditCard[];
  categories: Category[];
  merchants: Merchant[];
  paymentApps: PaymentApp[];
  transactions: Transaction[];
  recurring: RecurringTransaction[];
  subscriptions: Subscription[];
  budgets: Budget[];
  goals?: Goal[];
  loans: Loan[];
  investments: Investment[];
  debts: DebtRecord[];
  reconciliations: AccountReconciliation[];
  settings: AppSettings;
}

export type LocalStorageState = AppBackupData;
