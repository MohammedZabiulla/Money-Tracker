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
  const accountNameMap = new Map<string, string>();
  initialAccounts.forEach(acc => {
    accountMap.set(acc.id, acc.openingBalance || 0);
    if (acc.name) accountNameMap.set(acc.name.toLowerCase().trim(), acc.id);
  });

  const cardMap = new Map<string, number>();
  const cardNameMap = new Map<string, string>();
  initialCards.forEach(card => {
    cardMap.set(card.id, card.openingBalance || 0);
    if (card.name) cardNameMap.set(card.name.toLowerCase().trim(), card.id);
  });

  const investmentMap = new Map<string, { invested: number, current: number }>();
  initialInvestments.forEach(inv => {
    investmentMap.set(inv.id, { invested: inv.investedAmount || 0, current: inv.currentValue || 0 });
  });

  const loanPrincipalMap = new Map<string, number>();
  initialLoans.forEach(loan => loanPrincipalMap.set(loan.id, loan.principalAmount || 0));

  const debtMap = new Map<string, number>();
  initialDebts.forEach(d => debtMap.set(d.id, d.amount || 0));

  // Sort active non-deleted transactions chronologically
  const activeTx = transactions
    .filter(t => !t.isDeleted)
    .sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      
      const dateCompare = dateA.localeCompare(dateB);
      if (dateCompare !== 0) return dateCompare;
      
      const timeA = a.time || '00:00:00';
      const timeB = b.time || '00:00:00';
      const timeCompare = timeA.localeCompare(timeB);
      if (timeCompare !== 0) return timeCompare;
      
      const tsA = a.timestamp || a.createdAt || 0;
      const tsB = b.timestamp || b.createdAt || 0;
      if (tsA !== tsB) return tsA - tsB;
      
      return (a.id || '').localeCompare(b.id || '');
    });

  // Apply ledger mutations
  for (const tx of activeTx) {
    const amount = Math.abs(Number(tx.amount) || 0);
    if (amount <= 0) continue;

    // Resolve effective Card and Account IDs (with name-based fallback and cross-mapping)
    let effectiveCardId = (tx.creditCardId && cardMap.has(tx.creditCardId))
      ? tx.creditCardId
      : (tx.creditCardId && cardNameMap.has(tx.creditCardId.toLowerCase().trim()))
        ? cardNameMap.get(tx.creditCardId.toLowerCase().trim())
        : (tx.creditCardName ? cardNameMap.get(tx.creditCardName.toLowerCase().trim()) : undefined);

    if (!effectiveCardId && tx.accountId && cardMap.has(tx.accountId)) {
      effectiveCardId = tx.accountId;
    }
    if (!effectiveCardId && tx.accountName && cardNameMap.has(tx.accountName.toLowerCase().trim())) {
      effectiveCardId = cardNameMap.get(tx.accountName.toLowerCase().trim());
    }

    let effectiveAccountId = (tx.accountId && accountMap.has(tx.accountId))
      ? tx.accountId
      : (tx.accountId && accountNameMap.has(tx.accountId.toLowerCase().trim()))
        ? accountNameMap.get(tx.accountId.toLowerCase().trim())
        : (tx.accountName ? accountNameMap.get(tx.accountName.toLowerCase().trim()) : undefined);

    if (!effectiveAccountId && tx.creditCardId && accountMap.has(tx.creditCardId)) {
      effectiveAccountId = tx.creditCardId;
    }
    if (!effectiveAccountId && tx.creditCardName && accountNameMap.has(tx.creditCardName.toLowerCase().trim())) {
      effectiveAccountId = accountNameMap.get(tx.creditCardName.toLowerCase().trim());
    }

    let effectiveToAccountId = (tx.toAccountId && accountMap.has(tx.toAccountId))
      ? tx.toAccountId
      : (tx.toAccountId && accountNameMap.has(tx.toAccountId.toLowerCase().trim()))
        ? accountNameMap.get(tx.toAccountId.toLowerCase().trim())
        : (tx.toAccountName ? accountNameMap.get(tx.toAccountName.toLowerCase().trim()) : undefined);

    if (!effectiveToAccountId && tx.toCreditCardId && accountMap.has(tx.toCreditCardId)) {
      effectiveToAccountId = tx.toCreditCardId;
    }
    if (!effectiveToAccountId && tx.toCreditCardName && accountNameMap.has(tx.toCreditCardName.toLowerCase().trim())) {
      effectiveToAccountId = accountNameMap.get(tx.toCreditCardName.toLowerCase().trim());
    }

    let effectiveToCardId = (tx.toCreditCardId && cardMap.has(tx.toCreditCardId))
      ? tx.toCreditCardId
      : (tx.toCreditCardId && cardNameMap.has(tx.toCreditCardId.toLowerCase().trim()))
        ? cardNameMap.get(tx.toCreditCardId.toLowerCase().trim())
        : (tx.toCreditCardName ? cardNameMap.get(tx.toCreditCardName.toLowerCase().trim()) : undefined);

    if (!effectiveToCardId && tx.toAccountId && cardMap.has(tx.toAccountId)) {
      effectiveToCardId = tx.toAccountId;
    }
    if (!effectiveToCardId && tx.toAccountName && cardNameMap.has(tx.toAccountName.toLowerCase().trim())) {
      effectiveToCardId = cardNameMap.get(tx.toAccountName.toLowerCase().trim());
    }

    switch (tx.type) {
      case 'EXPENSE':
        if (effectiveCardId && cardMap.has(effectiveCardId)) {
          // Card purchase increases card outstanding liability
          const current = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeAdd(current, amount));
        } else if (effectiveAccountId && accountMap.has(effectiveAccountId)) {
          // Bank/Cash expense decreases account balance
          const current = accountMap.get(effectiveAccountId)!;
          accountMap.set(effectiveAccountId, safeSubtract(current, amount));
        }
        break;

      case 'INCOME':
        if (effectiveCardId && cardMap.has(effectiveCardId)) {
          // Income/refund to credit card decreases liability
          const current = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeSubtract(current, amount));
        } else if (effectiveAccountId && accountMap.has(effectiveAccountId)) {
          const current = accountMap.get(effectiveAccountId)!;
          accountMap.set(effectiveAccountId, safeAdd(current, amount));
        }
        break;

      case 'TRANSFER':
        // Handle source side of transfer
        if (effectiveAccountId && accountMap.has(effectiveAccountId)) {
          const srcBal = accountMap.get(effectiveAccountId)!;
          accountMap.set(effectiveAccountId, safeSubtract(srcBal, amount));
        } else if (effectiveCardId && cardMap.has(effectiveCardId)) {
          // Transfer FROM credit card (e.g. cash advance) increases liability
          const srcBal = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeAdd(srcBal, amount));
        }

        // Handle destination side of transfer
        if (effectiveToAccountId && accountMap.has(effectiveToAccountId)) {
          const destBal = accountMap.get(effectiveToAccountId)!;
          accountMap.set(effectiveToAccountId, safeAdd(destBal, amount));
        } else if (effectiveToCardId && cardMap.has(effectiveToCardId)) {
          // Transfer TO credit card decreases liability
          const destBal = cardMap.get(effectiveToCardId)!;
          cardMap.set(effectiveToCardId, safeSubtract(destBal, amount));
        } else if (effectiveCardId && !effectiveToAccountId && !effectiveToCardId && cardMap.has(effectiveCardId)) {
          // Fallback if destination was set on creditCardId
          const destBal = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeSubtract(destBal, amount));
        }
        break;

      case 'CARD_PAYMENT':
        // Source pays credit card -> source decreases (or liability increases if card), dest liability decreases
        const paySourceAccountId = effectiveAccountId || effectiveToAccountId;
        const paySourceCardId = (tx.accountId || tx.toAccountId) ? undefined : tx.creditCardId;

        // If paying FROM a credit card (rare, but supported)
        if (!paySourceAccountId && paySourceCardId && cardMap.has(paySourceCardId)) {
          const srcCardBal = cardMap.get(paySourceCardId)!;
          cardMap.set(paySourceCardId, safeAdd(srcCardBal, amount)); // Paying from a card increases its debt
        } else if (paySourceAccountId && accountMap.has(paySourceAccountId)) {
          const bankBal = accountMap.get(paySourceAccountId)!;
          accountMap.set(paySourceAccountId, safeSubtract(bankBal, amount));
        }

        const payDestCardId = effectiveToCardId || (paySourceCardId ? undefined : effectiveCardId);
        if (payDestCardId && cardMap.has(payDestCardId)) {
          const destCardBal = cardMap.get(payDestCardId)!;
          cardMap.set(payDestCardId, safeSubtract(destCardBal, amount));
        }
        break;

      case 'INVESTMENT_CONTRIBUTION':
        if (effectiveCardId && cardMap.has(effectiveCardId)) {
          const cardBal = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeAdd(cardBal, amount));
        } else if (effectiveAccountId && accountMap.has(effectiveAccountId)) {
          const bankBal = accountMap.get(effectiveAccountId)!;
          accountMap.set(effectiveAccountId, safeSubtract(bankBal, amount));
        }
        if (tx.investmentId && investmentMap.has(tx.investmentId)) {
          const current = investmentMap.get(tx.investmentId)!;
          investmentMap.set(tx.investmentId, {
            invested: safeAdd(current.invested, amount),
            current: safeAdd(current.current, amount),
          });
        }
        break;

      case 'INVESTMENT_WITHDRAWAL':
        if (effectiveCardId && cardMap.has(effectiveCardId)) {
          const cardBal = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeSubtract(cardBal, amount));
        } else if (effectiveAccountId && accountMap.has(effectiveAccountId)) {
          const bankBal = accountMap.get(effectiveAccountId)!;
          accountMap.set(effectiveAccountId, safeAdd(bankBal, amount));
        }
        if (tx.investmentId && investmentMap.has(tx.investmentId)) {
          const current = investmentMap.get(tx.investmentId)!;
          investmentMap.set(tx.investmentId, {
            invested: safeSubtract(current.invested, amount),
            current: safeSubtract(current.current, amount),
          });
        }
        break;

      case 'LOAN_DISBURSEMENT':
        if (effectiveCardId && cardMap.has(effectiveCardId)) {
          const cardBal = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeSubtract(cardBal, amount));
        } else if (effectiveAccountId && accountMap.has(effectiveAccountId)) {
          const bankBal = accountMap.get(effectiveAccountId)!;
          accountMap.set(effectiveAccountId, safeAdd(bankBal, amount));
        }
        if (tx.loanId && loanPrincipalMap.has(tx.loanId)) {
          const current = loanPrincipalMap.get(tx.loanId)!;
          loanPrincipalMap.set(tx.loanId, safeAdd(current, amount));
        }
        break;

      case 'LOAN_REPAYMENT':
        // Repayment decreases bank or increases card liability
        if (effectiveCardId && cardMap.has(effectiveCardId)) {
          const cardBal = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeAdd(cardBal, amount));
        } else if (effectiveAccountId && accountMap.has(effectiveAccountId)) {
          const bankBal = accountMap.get(effectiveAccountId)!;
          accountMap.set(effectiveAccountId, safeSubtract(bankBal, amount));
        }
        // Principal portion reduces loan liability
        const principalPortion = Number(tx.loanPrincipalPortion) || amount;
        if (tx.loanId && loanPrincipalMap.has(tx.loanId)) {
          const current = loanPrincipalMap.get(tx.loanId)!;
          loanPrincipalMap.set(tx.loanId, Math.max(0, safeSubtract(current, principalPortion)));
        }
        break;

      case 'MONEY_LENT':
        // Gave money to someone -> Bank decreases or Card increases, debt receivable created
        if (effectiveCardId && cardMap.has(effectiveCardId)) {
          const cardBal = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeAdd(cardBal, amount));
        } else if (effectiveAccountId && accountMap.has(effectiveAccountId)) {
          const bankBal = accountMap.get(effectiveAccountId)!;
          accountMap.set(effectiveAccountId, safeSubtract(bankBal, amount));
        }
        break;

      case 'MONEY_LENT_REPAYMENT':
        // Received money back that was lent -> Bank increases or Card decreases
        if (effectiveCardId && cardMap.has(effectiveCardId)) {
          const cardBal = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeSubtract(cardBal, amount));
        } else if (effectiveAccountId && accountMap.has(effectiveAccountId)) {
          const bankBal = accountMap.get(effectiveAccountId)!;
          accountMap.set(effectiveAccountId, safeAdd(bankBal, amount));
        }
        break;

      case 'MONEY_BORROWED':
        // Borrowed money from someone -> Bank increases or Card decreases
        if (effectiveCardId && cardMap.has(effectiveCardId)) {
          const cardBal = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeSubtract(cardBal, amount));
        } else if (effectiveAccountId && accountMap.has(effectiveAccountId)) {
          const bankBal = accountMap.get(effectiveAccountId)!;
          accountMap.set(effectiveAccountId, safeAdd(bankBal, amount));
        }
        break;

      case 'MONEY_BORROWED_REPAYMENT':
        // Repaid borrowed money -> Bank decreases or Card increases
        if (effectiveCardId && cardMap.has(effectiveCardId)) {
          const cardBal = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeAdd(cardBal, amount));
        } else if (effectiveAccountId && accountMap.has(effectiveAccountId)) {
          const bankBal = accountMap.get(effectiveAccountId)!;
          accountMap.set(effectiveAccountId, safeSubtract(bankBal, amount));
        }
        break;

      case 'REFUND':
        // Refund increases bank or reduces card outstanding
        if (effectiveCardId && cardMap.has(effectiveCardId)) {
          const cardBal = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeSubtract(cardBal, amount));
        } else if (effectiveAccountId && accountMap.has(effectiveAccountId)) {
          const bankBal = accountMap.get(effectiveAccountId)!;
          accountMap.set(effectiveAccountId, safeAdd(bankBal, amount));
        }
        break;

      case 'ADJUSTMENT':
        // Direct adjustment from reconciliation
        if (effectiveCardId && cardMap.has(effectiveCardId)) {
          const cardBal = cardMap.get(effectiveCardId)!;
          cardMap.set(effectiveCardId, safeAdd(cardBal, amount));
        } else if (effectiveAccountId && accountMap.has(effectiveAccountId)) {
          const bankBal = accountMap.get(effectiveAccountId)!;
          accountMap.set(effectiveAccountId, safeAdd(bankBal, amount));
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

  const updatedInvestments = initialInvestments.map(inv => {
    const data = investmentMap.get(inv.id);
    return data ? { ...inv, investedAmount: data.invested, currentValue: Math.max(data.current, inv.currentValue) } : inv;
  });

  // Dynamically compute remaining balance and settlement status for debts from active transactions
  const updatedDebts = initialDebts.map(debt => {
    const targetType = debt.type === 'LENT' ? 'MONEY_LENT_REPAYMENT' : 'MONEY_BORROWED_REPAYMENT';
    const totalRepayments = activeTx
      .filter(t => t.type === targetType && (t.debtId ? t.debtId === debt.id : (t.debtPersonName && t.debtPersonName.toLowerCase().trim() === debt.personName.toLowerCase().trim())))
      .reduce((sum, t) => safeAdd(sum, Math.abs(Number(t.amount) || 0)), 0);

    const calculatedRemaining = Math.max(0, safeSubtract(debt.amount, totalRepayments));

    let isNowSettled: boolean;
    let finalRemaining: number;

    if (totalRepayments > 0) {
      finalRemaining = calculatedRemaining;
      isNowSettled = debt.amount > 0 ? calculatedRemaining <= 0 : !!debt.isSettled;
    } else {
      // No active repayment transactions exist
      if (debt.isSettled) {
        isNowSettled = true;
        finalRemaining = 0;
      } else {
        isNowSettled = false;
        finalRemaining = debt.remainingAmount !== undefined ? Math.min(debt.amount, debt.remainingAmount) : debt.amount;
      }
    }

    return {
      ...debt,
      remainingAmount: finalRemaining,
      isSettled: isNowSettled,
    };
  });

  return {
    accounts: updatedAccounts,
    cards: updatedCards,
    investments: updatedInvestments,
    loans: updatedLoans,
    debts: updatedDebts,
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

  const totalInvestments = investments.filter(i => !i.isDeleted).reduce((sum, inv) => safeAdd(sum, inv.currentValue || inv.investedAmount), 0);
  const totalInvestedCost = investments.filter(i => !i.isDeleted).reduce((sum, inv) => safeAdd(sum, inv.investedAmount), 0);
  const investmentGainLoss = safeSubtract(totalInvestments, totalInvestedCost);

  const totalReceivables = debts
    .filter(d => !d.isDeleted && d.type === 'LENT' && !d.isSettled && (d.remainingAmount === undefined || d.remainingAmount > 0))
    .reduce((sum, d) => safeAdd(sum, d.remainingAmount !== undefined ? d.remainingAmount : d.amount), 0);

  const totalAssets = safeAdd(safeAdd(totalBankAndDeposits, totalInvestments), totalReceivables);

  // Total Liabilities
  const creditTotalLimit = cards.filter(c => !c.isDeleted && c.isActive).reduce((sum, c) => safeAdd(sum, c.creditLimit), 0);
  const creditTotalOutstanding = cards.filter(c => !c.isDeleted && c.isActive).reduce((sum, c) => safeAdd(sum, c.currentOutstanding), 0);
  const creditUtilizationPercent = creditTotalLimit > 0 ? Math.min(100, (creditTotalOutstanding / creditTotalLimit) * 100) : 0;

  const totalLoansOutstanding = loans.filter(l => !l.isDeleted).reduce((sum, l) => safeAdd(sum, l.outstandingPrincipal), 0);

  const totalPayables = debts
    .filter(d => !d.isDeleted && d.type === 'BORROWED' && !d.isSettled && (d.remainingAmount === undefined || d.remainingAmount > 0))
    .reduce((sum, d) => safeAdd(sum, d.remainingAmount !== undefined ? d.remainingAmount : d.amount), 0);

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

  // Linear scan from most recent transactions without allocating / sorting arrays
  for (let i = transactions.length - 1; i >= 0; i--) {
    const t = transactions[i];
    if (!t.isDeleted && t.merchantName && t.merchantName.toLowerCase() === cleanName) {
      return {
        categoryId: t.categoryId,
        accountId: t.accountId,
        creditCardId: t.creditCardId,
        paymentAppId: t.paymentAppId,
      };
    }
  }

  return {};
}

/**
 * Automatically generates a descriptive transaction note / narration for debt operations
 * including installment counts (e.g., "Part payment received from Rahul - 1", "Final Settlement from Rahul").
 */
export function generateDebtTransactionNarration(options: {
  type: 'MONEY_LENT' | 'MONEY_BORROWED' | 'MONEY_LENT_REPAYMENT' | 'MONEY_BORROWED_REPAYMENT' | string;
  personName: string;
  amount: number;
  remainingBeforePayment?: number;
  totalDebtAmount?: number;
  existingTransactions?: Transaction[]; // For backward compatibility if used elsewhere
  debtId?: string;
  isSettledDirectly?: boolean;
  installmentCount?: number;
}): string {
  const person = (options.personName || '').trim() || 'Person';
  if (options.type === 'MONEY_LENT') {
    return `Lent money to ${person}`;
  }
  if (options.type === 'MONEY_BORROWED') {
    return `Borrowed money from ${person}`;
  }

  const isLentReturn = options.type === 'MONEY_LENT_REPAYMENT';
  const targetType = isLentReturn ? 'MONEY_LENT_REPAYMENT' : 'MONEY_BORROWED_REPAYMENT';

  // Use provided installment count or compute it
  let priorCount = options.installmentCount || 0;
  
  if (options.installmentCount === undefined && options.existingTransactions) {
    for (let i = 0; i < options.existingTransactions.length; i++) {
      const t = options.existingTransactions[i];
      if (
        !t.isDeleted &&
        t.type === targetType &&
        (t.debtId === options.debtId ||
          (t.debtPersonName && t.debtPersonName.toLowerCase().trim() === person.toLowerCase().trim()))
      ) {
        priorCount++;
      }
    }
  }

  const installmentNumber = priorCount + 1;

  // Determine if this payment completes the settlement
  const rem = options.remainingBeforePayment !== undefined
    ? options.remainingBeforePayment
    : (options.totalDebtAmount !== undefined ? options.totalDebtAmount : options.amount);
  
  const willSettle = options.isSettledDirectly || (rem > 0 && options.amount >= rem);

  if (isLentReturn) {
    if (willSettle) {
      if (installmentNumber > 1) {
        return `Final Settlement from ${person} - ${installmentNumber}`;
      }
      return `Final Settlement from ${person}`;
    }
    return `Part payment received from ${person} - ${installmentNumber}`;
  } else {
    // MONEY_BORROWED_REPAYMENT
    if (willSettle) {
      if (installmentNumber > 1) {
        return `Final Settlement to ${person} - ${installmentNumber}`;
      }
      return `Final Settlement to ${person}`;
    }
    return `Part payment made to ${person} - ${installmentNumber}`;
  }
}
