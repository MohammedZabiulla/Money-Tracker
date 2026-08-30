import { Account, CreditCard, Transaction, Investment, DebtRecord } from '../types';
import { recalculateAllBalances, computeFinancialSummary } from './accountingEngine';

export interface TestResult {
  name: string;
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

/**
 * Executes the required accounting suite as per Section 89 of the specification.
 */
export function runAccountingSuite(): { passed: boolean; results: TestResult[] } {
  const results: TestResult[] = [];

  // Helper factory
  const createBaseAccount = (id: string, name: string, type: any, balance: number): Account => ({
    id,
    name,
    institution: name,
    type,
    openingBalance: balance,
    calculatedBalance: balance,
    icon: 'Landmark',
    color: '#004c8f',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const createBaseCard = (id: string, name: string, limit: number, outstanding: number): CreditCard => ({
    id,
    name,
    issuer: 'HDFC Bank',
    lastFourDigits: '1234',
    creditLimit: limit,
    openingBalance: outstanding,
    currentOutstanding: outstanding,
    statementDate: 15,
    dueDate: 5,
    icon: 'CreditCard',
    color: '#1e3a8a',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Test 1: HDFC ₹1,00,000 - ₹5,000 expense = ₹95,000
  {
    const hdfc = createBaseAccount('hdfc', 'HDFC Bank', 'SAVINGS', 100000);
    const tx: Transaction = {
      id: 'tx1',
      amount: 5000,
      type: 'EXPENSE',
      accountId: 'hdfc',
      date: '2026-08-15',
      time: '12:00',
      timestamp: 1000,
      createdAt: 1000,
      updatedAt: 1000,
    };
    const res = recalculateAllBalances([hdfc], [], [], [], [], [tx]);
    const actual = res.accounts[0].calculatedBalance;
    const passed = actual === 95000;
    results.push({
      name: 'Test 1: Expense deduction',
      description: 'HDFC ₹1,00,000 - ₹5,000 expense = ₹95,000',
      passed,
      expected: '₹95,000',
      actual: `₹${actual.toLocaleString('en-IN')}`,
    });
  }

  // Test 2: HDFC ₹1,00,000 -> ICICI ₹20,000 = HDFC ₹80,000 and ICICI +₹20,000, no expense
  {
    const hdfc = createBaseAccount('hdfc', 'HDFC Bank', 'SAVINGS', 100000);
    const icici = createBaseAccount('icici', 'ICICI Bank', 'SAVINGS', 0);
    const tx: Transaction = {
      id: 'tx2',
      amount: 20000,
      type: 'TRANSFER',
      accountId: 'hdfc',
      toAccountId: 'icici',
      date: '2026-08-15',
      time: '12:00',
      timestamp: 1000,
      createdAt: 1000,
      updatedAt: 1000,
    };
    const res = recalculateAllBalances([hdfc, icici], [], [], [], [], [tx]);
    const summary = computeFinancialSummary(res.accounts, [], [], [], [], [tx], '2026-08');
    const hdfcBal = res.accounts.find(a => a.id === 'hdfc')!.calculatedBalance;
    const iciciBal = res.accounts.find(a => a.id === 'icici')!.calculatedBalance;
    const passed = hdfcBal === 80000 && iciciBal === 20000 && summary.monthlyExpenses === 0;
    results.push({
      name: 'Test 2: Account Transfer without expense inflation',
      description: 'HDFC ₹1,00,000 -> ICICI ₹20,000 (HDFC=₹80,000, ICICI=₹20,000, Expense=₹0)',
      passed,
      expected: 'HDFC: ₹80,000, ICICI: ₹20,000, Expense: ₹0',
      actual: `HDFC: ₹${hdfcBal.toLocaleString('en-IN')}, ICICI: ₹${iciciBal.toLocaleString('en-IN')}, Expense: ₹${summary.monthlyExpenses}`,
    });
  }

  // Test 3: HDFC ₹1,00,000 -> Cash ₹10,000 = HDFC ₹90,000 and Cash ₹10,000, no expense
  {
    const hdfc = createBaseAccount('hdfc', 'HDFC Bank', 'SAVINGS', 100000);
    const cash = createBaseAccount('cash', 'Cash Wallet', 'CASH', 0);
    const tx: Transaction = {
      id: 'tx3',
      amount: 10000,
      type: 'TRANSFER',
      accountId: 'hdfc',
      toAccountId: 'cash',
      date: '2026-08-15',
      time: '12:00',
      timestamp: 1000,
      createdAt: 1000,
      updatedAt: 1000,
    };
    const res = recalculateAllBalances([hdfc, cash], [], [], [], [], [tx]);
    const summary = computeFinancialSummary(res.accounts, [], [], [], [], [tx], '2026-08');
    const hdfcBal = res.accounts.find(a => a.id === 'hdfc')!.calculatedBalance;
    const cashBal = res.accounts.find(a => a.id === 'cash')!.calculatedBalance;
    const passed = hdfcBal === 90000 && cashBal === 10000 && summary.monthlyExpenses === 0;
    results.push({
      name: 'Test 3: ATM Cash Withdrawal',
      description: 'HDFC ₹1,00,000 -> Cash ₹10,000 (HDFC=₹90,000, Cash=₹10,000, Expense=₹0)',
      passed,
      expected: 'HDFC: ₹90,000, Cash: ₹10,000, Expense: ₹0',
      actual: `HDFC: ₹${hdfcBal.toLocaleString('en-IN')}, Cash: ₹${cashBal.toLocaleString('en-IN')}, Expense: ₹${summary.monthlyExpenses}`,
    });
  }

  // Test 4: Card purchase ₹5,000 = expense ₹5,000 + card liability ₹5,000
  {
    const card = createBaseCard('card1', 'Regalia Gold', 200000, 0);
    const tx: Transaction = {
      id: 'tx4',
      amount: 5000,
      type: 'EXPENSE',
      creditCardId: 'card1',
      date: '2026-08-15',
      time: '12:00',
      timestamp: 1000,
      createdAt: 1000,
      updatedAt: 1000,
    };
    const res = recalculateAllBalances([], [card], [], [], [], [tx]);
    const summary = computeFinancialSummary([], res.cards, [], [], [], [tx], '2026-08');
    const cardOutstanding = res.cards[0].currentOutstanding;
    const passed = cardOutstanding === 5000 && summary.monthlyExpenses === 5000;
    results.push({
      name: 'Test 4: Credit Card Purchase',
      description: 'Card purchase ₹5,000 (Card Liability=₹5,000, Expense=₹5,000)',
      passed,
      expected: 'Outstanding: ₹5,000, Expense: ₹5,000',
      actual: `Outstanding: ₹${cardOutstanding.toLocaleString('en-IN')}, Expense: ₹${summary.monthlyExpenses}`,
    });
  }

  // Test 5: Card payment ₹5,000 = bank -₹5,000 + card liability -₹5,000, no additional expense
  {
    const hdfc = createBaseAccount('hdfc', 'HDFC Bank', 'SAVINGS', 50000);
    const card = createBaseCard('card1', 'Regalia Gold', 200000, 5000);
    const tx: Transaction = {
      id: 'tx5',
      amount: 5000,
      type: 'CARD_PAYMENT',
      accountId: 'hdfc',
      creditCardId: 'card1',
      date: '2026-08-15',
      time: '12:00',
      timestamp: 1000,
      createdAt: 1000,
      updatedAt: 1000,
    };
    const res = recalculateAllBalances([hdfc], [card], [], [], [], [tx]);
    const summary = computeFinancialSummary(res.accounts, res.cards, [], [], [], [tx], '2026-08');
    const hdfcBal = res.accounts[0].calculatedBalance;
    const cardOutstanding = res.cards[0].currentOutstanding;
    const passed = hdfcBal === 45000 && cardOutstanding === 0 && summary.monthlyExpenses === 0;
    results.push({
      name: 'Test 5: Credit Card Bill Payment',
      description: 'Bank payment to CC ₹5,000 (Bank=₹45,000, CC Outstanding=₹0, Extra Expense=₹0)',
      passed,
      expected: 'Bank: ₹45,000, CC Outstanding: ₹0, Expense: ₹0',
      actual: `Bank: ₹${hdfcBal.toLocaleString('en-IN')}, CC Outstanding: ₹${cardOutstanding}, Expense: ₹${summary.monthlyExpenses}`,
    });
  }

  // Test 6: Investment ₹10,000 = bank -₹10,000 + investment asset ₹10,000
  {
    const hdfc = createBaseAccount('hdfc', 'HDFC Bank', 'SAVINGS', 50000);
    const investment: Investment = {
      id: 'inv1',
      name: 'Nifty 50 Index Fund',
      category: 'MUTUAL_FUNDS',
      investedAmount: 10000,
      currentValue: 10000,
      purchaseDate: '2026-08-15',
      updatedAt: 1000,
    };
    const tx: Transaction = {
      id: 'tx6',
      amount: 10000,
      type: 'INVESTMENT_CONTRIBUTION',
      accountId: 'hdfc',
      investmentId: 'inv1',
      date: '2026-08-15',
      time: '12:00',
      timestamp: 1000,
      createdAt: 1000,
      updatedAt: 1000,
    };
    const res = recalculateAllBalances([hdfc], [], [investment], [], [], [tx]);
    const summary = computeFinancialSummary(res.accounts, [], res.investments, [], [], [tx], '2026-08');
    const hdfcBal = res.accounts[0].calculatedBalance;
    const passed = hdfcBal === 40000 && summary.totalInvestments === 10000 && summary.monthlyExpenses === 0;
    results.push({
      name: 'Test 6: Investment Contribution',
      description: 'Invest ₹10,000 (Bank=₹40,000, Investment Asset=₹10,000, Regular Expense=₹0)',
      passed,
      expected: 'Bank: ₹40,000, Investment: ₹10,000, Net Worth unchanged',
      actual: `Bank: ₹${hdfcBal.toLocaleString('en-IN')}, Investment: ₹${summary.totalInvestments}, Net Worth: ₹${summary.netWorth}`,
    });
  }

  // Test 7: Money lent ₹10,000 = bank -₹10,000 + receivable ₹10,000
  {
    const hdfc = createBaseAccount('hdfc', 'HDFC Bank', 'SAVINGS', 50000);
    const debt: DebtRecord = {
      id: 'debt1',
      type: 'LENT',
      personName: 'Rahul',
      amount: 10000,
      remainingAmount: 10000,
      isSettled: false,
      createdAt: 1000,
    };
    const tx: Transaction = {
      id: 'tx7',
      amount: 10000,
      type: 'MONEY_LENT',
      accountId: 'hdfc',
      debtPersonName: 'Rahul',
      date: '2026-08-15',
      time: '12:00',
      timestamp: 1000,
      createdAt: 1000,
      updatedAt: 1000,
    };
    const res = recalculateAllBalances([hdfc], [], [], [], [debt], [tx]);
    const summary = computeFinancialSummary(res.accounts, [], [], [], res.debts, [tx], '2026-08');
    const hdfcBal = res.accounts[0].calculatedBalance;
    const passed = hdfcBal === 40000 && summary.totalReceivables === 10000 && summary.monthlyExpenses === 0;
    results.push({
      name: 'Test 7: Money Lent (Receivable)',
      description: 'Lend ₹10,000 (Bank=₹40,000, Receivable Asset=₹10,000, Expense=₹0)',
      passed,
      expected: 'Bank: ₹40,000, Receivable: ₹10,000',
      actual: `Bank: ₹${hdfcBal.toLocaleString('en-IN')}, Receivable: ₹${summary.totalReceivables}`,
    });
  }

  // Test 8: Money borrowed ₹20,000 = bank +₹20,000 + liability ₹20,000
  {
    const hdfc = createBaseAccount('hdfc', 'HDFC Bank', 'SAVINGS', 50000);
    const debt: DebtRecord = {
      id: 'debt2',
      type: 'BORROWED',
      personName: 'Amit',
      amount: 20000,
      remainingAmount: 20000,
      isSettled: false,
      createdAt: 1000,
    };
    const tx: Transaction = {
      id: 'tx8',
      amount: 20000,
      type: 'MONEY_BORROWED',
      accountId: 'hdfc',
      debtPersonName: 'Amit',
      date: '2026-08-15',
      time: '12:00',
      timestamp: 1000,
      createdAt: 1000,
      updatedAt: 1000,
    };
    const res = recalculateAllBalances([hdfc], [], [], [], [debt], [tx]);
    const summary = computeFinancialSummary(res.accounts, [], [], [], res.debts, [tx], '2026-08');
    const hdfcBal = res.accounts[0].calculatedBalance;
    const passed = hdfcBal === 70000 && summary.totalPayables === 20000 && summary.monthlyIncome === 0;
    results.push({
      name: 'Test 8: Money Borrowed (Liability)',
      description: 'Borrow ₹20,000 (Bank=₹70,000, Liability=₹20,000, Income=₹0)',
      passed,
      expected: 'Bank: ₹70,000, Liability: ₹20,000, Income: ₹0',
      actual: `Bank: ₹${hdfcBal.toLocaleString('en-IN')}, Liability: ₹${summary.totalPayables}, Income: ₹${summary.monthlyIncome}`,
    });
  }

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}
