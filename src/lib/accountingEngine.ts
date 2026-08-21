import {
  Account,
  CreditCard,
  Transaction,
  Investment,
  Loan,
  DebtRecord,
  Category,
  Merchant,
} from '../types';
import { safeAdd, safeSubtract } from './currency';

export interface FinancialSummary {
  availableBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRatePercent: number;
  creditTotalLimit: number;
  creditTotalOutstanding: number;
  creditUtilizationPercent: number;
  totalInvestments: number;
  investmentGainLoss: number;
  totalLoansOutstanding: number;
  totalReceivables: number;
  totalPayables: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  totalAmount: number;
  percentage: number;
  transactionCount: number;
}

/**
 * Calculates current account and card balances by applying the full immutable transaction ledger
 * onto opening balances with atomic precision.
 */
export function recalculateAllBalances(
  initialAccounts: Account[],
  initialCards: CreditCard[],
  initialInvestments: Investment[],
  initialLoans: Loan[],
  initialDebts: DebtRecord[],
  transactions: Transaction[]
): {
  accounts: Account[];
  cards: CreditCard[];
  investments: Investment[];
  loans: Loan[];
  debts: DebtRecord[];
} {
  // Map opening balances
  const accountMap = new Map<string, number>();
  initialAccounts.forEach(acc => accountMap.set(acc.id, acc.openingBalance || 0));

  const cardMap = new Map<string, number>();
  initialCards.forEach(card => cardMap.set(card.id, card.openingBalance || 0));

  const loanPrincipalMap = new Map<string, number>();
  initialLoans.forEach(loan => loanPrincipalMap.set(loan.id, loan.principalAmount || 0));

  const debtMap = new Map<string, number>();
  initialDebts.forEach(d => debtMap.set(d.id, d.amount || 0));

  // Sort active non-deleted transactions chronologically
  const activeTx = transactions
    .filter(t => !t.isDeleted)
    .sort((a, b) => a.timestamp - b.timestamp);

  // Apply ledger mutations
  for (const tx of activeTx) {
    const amount = Number(tx.amount) || 0;
    if (amount <= 0) continue;

    switch (tx.type) {
      case 'EXPENSE':
        if (tx.creditCardId && cardMap.has(tx.creditCardId)) {
          // Card purchase increases card outstanding liability
          const current = cardMap.get(tx.creditCardId)!;
          cardMap.set(tx.creditCardId, safeAdd(current, amount));
        } else if (tx.accountId && accountMap.has(tx.accountId)) {
          // Bank/Cash expense decreases account balance
          const current = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeSubtract(current, amount));
        }
        break;

      case 'INCOME':
        if (tx.accountId && accountMap.has(tx.accountId)) {
          const current = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeAdd(current, amount));
        }
        break;

      case 'TRANSFER':
        if (tx.accountId && accountMap.has(tx.accountId)) {
          const srcBal = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeSubtract(srcBal, amount));
        }
        if (tx.toAccountId && accountMap.has(tx.toAccountId)) {
          const destBal = accountMap.get(tx.toAccountId)!;
          accountMap.set(tx.toAccountId, safeAdd(destBal, amount));
        }
        break;

      case 'CARD_PAYMENT':
        // Source bank pays credit card -> bank decreases, card liability decreases
        if (tx.accountId && accountMap.has(tx.accountId)) {
          const bankBal = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeSubtract(bankBal, amount));
        }
        if (tx.creditCardId && cardMap.has(tx.creditCardId)) {
          const cardBal = cardMap.get(tx.creditCardId)!;
          cardMap.set(tx.creditCardId, Math.max(0, safeSubtract(cardBal, amount)));
        }
        break;

      case 'INVESTMENT_CONTRIBUTION':
        if (tx.accountId && accountMap.has(tx.accountId)) {
          const bankBal = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeSubtract(bankBal, amount));
        }
        break;

      case 'INVESTMENT_WITHDRAWAL':
        if (tx.accountId && accountMap.has(tx.accountId)) {
          const bankBal = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeAdd(bankBal, amount));
        }
        break;

      case 'LOAN_DISBURSEMENT':
        if (tx.accountId && accountMap.has(tx.accountId)) {
          const bankBal = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeAdd(bankBal, amount));
        }
        if (tx.loanId && loanPrincipalMap.has(tx.loanId)) {
          const current = loanPrincipalMap.get(tx.loanId)!;
          loanPrincipalMap.set(tx.loanId, safeAdd(current, amount));
        }
        break;

      case 'LOAN_REPAYMENT':
        // Repayment decreases bank
        if (tx.accountId && accountMap.has(tx.accountId)) {
          const bankBal = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeSubtract(bankBal, amount));
        }
        // Principal portion reduces loan liability
        const principalPortion = Number(tx.loanPrincipalPortion) || amount;
        if (tx.loanId && loanPrincipalMap.has(tx.loanId)) {
          const current = loanPrincipalMap.get(tx.loanId)!;
          loanPrincipalMap.set(tx.loanId, Math.max(0, safeSubtract(current, principalPortion)));
        }
        break;

      case 'MONEY_LENT':
        // Gave money to someone -> Bank decreases, debt receivable created
        if (tx.accountId && accountMap.has(tx.accountId)) {
          const bankBal = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeSubtract(bankBal, amount));
        }
        break;

      case 'MONEY_LENT_REPAYMENT':
        // Received money back that was lent -> Bank increases
        if (tx.accountId && accountMap.has(tx.accountId)) {
          const bankBal = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeAdd(bankBal, amount));
        }
        break;

      case 'MONEY_BORROWED':
        // Borrowed money from someone -> Bank increases
        if (tx.accountId && accountMap.has(tx.accountId)) {
          const bankBal = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeAdd(bankBal, amount));
        }
        break;

      case 'MONEY_BORROWED_REPAYMENT':
        // Repaid borrowed money -> Bank decreases
        if (tx.accountId && accountMap.has(tx.accountId)) {
          const bankBal = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeSubtract(bankBal, amount));
        }
        break;

      case 'REFUND':
        // Refund increases bank or reduces card outstanding
        if (tx.creditCardId && cardMap.has(tx.creditCardId)) {
          const cardBal = cardMap.get(tx.creditCardId)!;
          cardMap.set(tx.creditCardId, Math.max(0, safeSubtract(cardBal, amount)));
        } else if (tx.accountId && accountMap.has(tx.accountId)) {
          const bankBal = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeAdd(bankBal, amount));
        }
        break;

      case 'ADJUSTMENT':
        // Direct adjustment from reconciliation
        if (tx.accountId && accountMap.has(tx.accountId)) {
          const bankBal = accountMap.get(tx.accountId)!;
          accountMap.set(tx.accountId, safeAdd(bankBal, amount));
        }
        break;
    }
  }

  const updatedAccounts = initialAccounts.map(acc => ({
    ...acc,
    calculatedBalance: accountMap.get(acc.id) ?? acc.openingBalance,
  }));

  const updatedCards = initialCards.map(card => ({
    ...card,
    currentOutstanding: cardMap.get(card.id) ?? card.openingBalance,
  }));

  const updatedLoans = initialLoans.map(loan => ({
    ...loan,
    outstandingPrincipal: loanPrincipalMap.get(loan.id) ?? loan.principalAmount,
  }));

  return {
    accounts: updatedAccounts,
    cards: updatedCards,
    investments: initialInvestments,
    loans: updatedLoans,
    debts: initialDebts,
  };
}

/**
 * Compute the high level financial metrics & summary
 */
export function computeFinancialSummary(
  accounts: Account[],
  cards: CreditCard[],
  investments: Investment[],
  loans: Loan[],
  debts: DebtRecord[],
  transactions: Transaction[],
  targetMonthStr?: string // YYYY-MM
): FinancialSummary {
  const currentMonth = targetMonthStr || new Date().toISOString().substring(0, 7);

  // Available Balance: Liquid accounts (Savings, Current, Salary, Cash, Wallets)
  const liquidAccountTypes = ['SAVINGS', 'CURRENT', 'SALARY', 'CASH', 'WALLET'];
  const availableBalance = accounts
    .filter(a => !a.isDeleted && a.isActive && !a.isExcludedFromNetWorth && liquidAccountTypes.includes(a.type))
    .reduce((sum, a) => safeAdd(sum, a.calculatedBalance), 0);

  // Total Assets
  const totalBankAndDeposits = accounts
    .filter(a => !a.isDeleted && a.isActive && !a.isExcludedFromNetWorth && a.type !== 'LOAN' && a.type !== 'CREDIT_CARD')
    .reduce((sum, a) => safeAdd(sum, a.calculatedBalance), 0);

  const totalInvestments = investments.reduce((sum, inv) => safeAdd(sum, inv.currentValue || inv.investedAmount), 0);
  const totalInvestedCost = investments.reduce((sum, inv) => safeAdd(sum, inv.investedAmount), 0);
  const investmentGainLoss = safeSubtract(totalInvestments, totalInvestedCost);

  const totalReceivables = debts
    .filter(d => d.type === 'LENT' && !d.isSettled)
    .reduce((sum, d) => safeAdd(sum, d.remainingAmount), 0);

  const totalAssets = safeAdd(safeAdd(totalBankAndDeposits, totalInvestments), totalReceivables);

  // Total Liabilities
  const creditTotalLimit = cards.filter(c => !c.isDeleted && c.isActive).reduce((sum, c) => safeAdd(sum, c.creditLimit), 0);
  const creditTotalOutstanding = cards.filter(c => !c.isDeleted && c.isActive).reduce((sum, c) => safeAdd(sum, c.currentOutstanding), 0);
  const creditUtilizationPercent = creditTotalLimit > 0 ? Math.min(100, (creditTotalOutstanding / creditTotalLimit) * 100) : 0;

  const totalLoansOutstanding = loans.reduce((sum, l) => safeAdd(sum, l.outstandingPrincipal), 0);

  const totalPayables = debts
    .filter(d => d.type === 'BORROWED' && !d.isSettled)
    .reduce((sum, d) => safeAdd(sum, d.remainingAmount), 0);

  const totalLiabilities = safeAdd(safeAdd(creditTotalOutstanding, totalLoansOutstanding), totalPayables);
  const netWorth = safeSubtract(totalAssets, totalLiabilities);

  // Monthly Income and Expenses for target month
  const monthTransactions = transactions.filter(
    t => !t.isDeleted && t.date.startsWith(currentMonth)
  );

  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  for (const t of monthTransactions) {
    if (t.type === 'INCOME') {
      monthlyIncome = safeAdd(monthlyIncome, t.amount);
    } else if (t.type === 'EXPENSE') {
      // Net of any refund
      const netAmount = safeSubtract(t.amount, t.refundAmount || 0);
      monthlyExpenses = safeAdd(monthlyExpenses, Math.max(0, netAmount));
    } else if (t.type === 'LOAN_REPAYMENT' && t.loanInterestPortion) {
      // Interest portion of loan repayment is an expense
      monthlyExpenses = safeAdd(monthlyExpenses, t.loanInterestPortion);
    }
  }

  const monthlySavings = safeSubtract(monthlyIncome, monthlyExpenses);
  const savingsRatePercent = monthlyIncome > 0 ? Math.max(0, Math.min(100, (monthlySavings / monthlyIncome) * 100)) : 0;

  return {
    availableBalance,
    totalAssets,
    totalLiabilities,
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    savingsRatePercent,
    creditTotalLimit,
    creditTotalOutstanding,
    creditUtilizationPercent,
    totalInvestments,
    investmentGainLoss,
    totalLoansOutstanding,
    totalReceivables,
    totalPayables,
  };
}

/**
 * Get category breakdown for a given period
 */
export function getCategorySpendingBreakdown(
  transactions: Transaction[],
  categories: Category[],
  filterMonth?: string
): CategorySpending[] {
  const filtered = transactions.filter(t => {
    if (t.isDeleted) return false;
    if (t.type !== 'EXPENSE') return false;
    if (filterMonth && !t.date.startsWith(filterMonth)) return false;
    return true;
  });

  const categoryMap = new Map<string, { total: number; count: number }>();
  let grandTotal = 0;

  filtered.forEach(t => {
    if (t.splits && t.splits.length > 0) {
      // Split transaction: allocate each split line to its category
      const totalSplit = t.splits.reduce((acc, s) => safeAdd(acc, s.amount || 0), 0);
      const refundRatio = (t.refundAmount || 0) > 0 && totalSplit > 0 ? (t.refundAmount || 0) / totalSplit : 0;
      
      t.splits.forEach(s => {
        const catId = s.categoryId || t.categoryId || 'misc_expense';
        const net = Math.max(0, safeSubtract(s.amount || 0, (s.amount || 0) * refundRatio));
        const curr = categoryMap.get(catId) || { total: 0, count: 0 };
        curr.total = safeAdd(curr.total, net);
        curr.count += 1;
        categoryMap.set(catId, curr);
        grandTotal = safeAdd(grandTotal, net);
      });
    } else {
      const catId = t.categoryId || 'misc_expense';
      const net = Math.max(0, safeSubtract(t.amount, t.refundAmount || 0));
      const curr = categoryMap.get(catId) || { total: 0, count: 0 };
      curr.total = safeAdd(curr.total, net);
      curr.count += 1;
      categoryMap.set(catId, curr);
      grandTotal = safeAdd(grandTotal, net);
    }
  });

  const categoryLookup = new Map(categories.map(c => [c.id, c]));

  const result: CategorySpending[] = [];
  categoryMap.forEach((data, catId) => {
    const cat = categoryLookup.get(catId);
    result.push({
      categoryId: catId,
      categoryName: cat?.name || 'Miscellaneous',
      color: cat?.color || '#94A3B8',
      icon: cat?.icon || 'HelpCircle',
      totalAmount: data.total,
      percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
      transactionCount: data.count,
    });
  });

  return result.sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Duplicate Transaction Detection
 * Detects if a new or imported transaction is a suspected duplicate
 */
export function detectDuplicateTransaction(
  candidate: Partial<Transaction>,
  existingTransactions: Transaction[]
): { isDuplicate: boolean; matchedTransaction?: Transaction; reason?: string } {
  if (!candidate.amount || !candidate.date) {
    return { isDuplicate: false };
  }

  const candAmount = candidate.amount;
  const candDate = candidate.date;
  const candMerchant = candidate.merchantName?.trim().toLowerCase();
  const candAccount = candidate.accountId || candidate.creditCardId;

  // Search within same date +/- 1 day
  const candTimestamp = new Date(candDate).getTime();

  for (const existing of existingTransactions) {
    if (existing.isDeleted) continue;
    if (existing.id === candidate.id) continue;

    if (Math.abs(existing.amount - candAmount) < 0.01) {
      const existingTime = new Date(existing.date).getTime();
      const dayDiff = Math.abs(candTimestamp - existingTime) / (1000 * 60 * 60 * 24);

      if (dayDiff <= 1) {
        const sameAccount = (existing.accountId && existing.accountId === candAccount) ||
                            (existing.creditCardId && existing.creditCardId === candAccount);
        const sameMerchant = candMerchant && existing.merchantName?.toLowerCase() === candMerchant;

        if (sameAccount && sameMerchant) {
          return {
            isDuplicate: true,
            matchedTransaction: existing,
            reason: `Found existing transaction of ${existing.amount} for ${existing.merchantName} on ${existing.date}`,
          };
        } else if (sameAccount && existing.categoryId === candidate.categoryId && dayDiff === 0) {
          return {
            isDuplicate: true,
            matchedTransaction: existing,
            reason: `Identical amount on same account & category on ${existing.date}`,
          };
        }
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Learn user pattern from transaction history:
 * Suggests category, payment method, account when user types a merchant name.
 */
export function learnMerchantSuggestion(
  merchantName: string,
  transactions: Transaction[],
  merchants: Merchant[]
): {
  categoryId?: string;
  accountId?: string;
  creditCardId?: string;
  paymentAppId?: string;
} {
  const cleanName = merchantName.trim().toLowerCase();
  if (!cleanName) return {};

  // Check saved merchant record first
  const saved = merchants.find(m => m.name.toLowerCase() === cleanName);
  if (saved && saved.defaultCategoryId) {
    return {
      categoryId: saved.defaultCategoryId,
      accountId: saved.defaultAccountId,
      paymentAppId: saved.defaultPaymentAppId,
    };
  }

  // Find most frequent combination in recent transactions
  const matched = transactions
    .filter(t => !t.isDeleted && t.merchantName?.toLowerCase() === cleanName)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (matched.length > 0) {
    const latest = matched[0];
    return {
      categoryId: latest.categoryId,
      accountId: latest.accountId,
      creditCardId: latest.creditCardId,
      paymentAppId: latest.paymentAppId,
    };
  }

  return {};
}
