import {
  RecurringTransaction,
  Subscription,
  Transaction,
  RecurrenceFrequency,
  TransactionType,
} from '../types';

/**
 * Accurately calculate the next due date based on frequency and interval.
 * Handles month-end clamping (e.g. Jan 31 -> Feb 28/29, Mar 31) and leap years.
 */
export function calculateNextDueDate(
  currentDueDate: string,
  frequency: RecurrenceFrequency,
  interval: number = 1
): string {
  const parts = currentDueDate.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);

  const safeInterval = Math.max(1, interval || 1);
  const dateObj = new Date(year, month, day);

  switch (frequency) {
    case 'DAILY': {
      dateObj.setDate(dateObj.getDate() + safeInterval);
      return formatDateISO(dateObj);
    }

    case 'WEEKLY': {
      dateObj.setDate(dateObj.getDate() + 7 * safeInterval);
      return formatDateISO(dateObj);
    }

    case 'MONTHLY': {
      return addMonthsClamped(year, month, day, safeInterval);
    }

    case 'QUARTERLY': {
      return addMonthsClamped(year, month, day, 3 * safeInterval);
    }

    case 'HALF_YEARLY': {
      return addMonthsClamped(year, month, day, 6 * safeInterval);
    }

    case 'YEARLY': {
      const targetYear = year + safeInterval;
      // Handle Feb 29 leap year case
      if (month === 1 && day === 29 && !isLeapYear(targetYear)) {
        return `${targetYear}-02-28`;
      }
      return `${targetYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    default:
      dateObj.setMonth(dateObj.getMonth() + safeInterval);
      return formatDateISO(dateObj);
  }
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year: number, monthZeroIndexed: number): number {
  return new Date(year, monthZeroIndexed + 1, 0).getDate();
}

function addMonthsClamped(
  startYear: number,
  startMonthZeroIndexed: number,
  targetDay: number,
  monthsToAdd: number
): string {
  const totalMonths = startMonthZeroIndexed + monthsToAdd;
  const newYear = startYear + Math.floor(totalMonths / 12);
  const newMonth = ((totalMonths % 12) + 12) % 12;

  const maxDaysInNewMonth = getDaysInMonth(newYear, newMonth);
  const clampedDay = Math.min(targetDay, maxDaysInNewMonth);

  return `${newYear}-${String(newMonth + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface GeneratedPaymentSummary {
  ruleId: string;
  name: string;
  amount: number;
  type: TransactionType;
  date: string;
  source: 'RECURRING' | 'SUBSCRIPTION';
}

export interface ProcessRecurringResult {
  updatedRecurring: RecurringTransaction[];
  updatedSubscriptions: Subscription[];
  newTransactions: Transaction[];
  generatedSummary: GeneratedPaymentSummary[];
}

/**
 * Evaluates all active recurring transactions and subscriptions,
 * identifies those due on or before the current date, generates the ledger entries,
 * and advances the schedule to the next future occurrence.
 */
export function processAllDueRecurring(
  recurringList: RecurringTransaction[],
  subscriptionsList: Subscription[],
  existingTransactions: Transaction[],
  currentDateStr: string = new Date().toISOString().substring(0, 10)
): ProcessRecurringResult {
  const newTransactions: Transaction[] = [];
  const generatedSummary: GeneratedPaymentSummary[] = [];

  // 1. Process Recurring Transaction Rules
  const updatedRecurring = recurringList.map(rule => {
    if (!rule.isActive || rule.isDeleted || rule.autoRecord === false) {
      return rule;
    }

    let nextDue = rule.nextDueDate || rule.startDate;
    let lastGen = rule.lastGeneratedDate;
    let modified = false;

    // Safety: prevent infinite loops by capping max catchup iterations
    let iterations = 0;
    const maxCatchup = 60;

    while (nextDue <= currentDateStr && iterations < maxCatchup) {
      iterations++;

      // Check if end date reached
      if (rule.endDate && nextDue > rule.endDate) {
        return {
          ...rule,
          isActive: false,
          updatedAt: Date.now(),
        };
      }

      // Check if a transaction for this rule & date already exists to prevent duplicates
      const alreadyExists = existingTransactions.some(
        t => !t.isDeleted && t.recurringId === rule.id && t.date === nextDue
      ) || newTransactions.some(
        t => t.recurringId === rule.id && t.date === nextDue
      );

      if (!alreadyExists) {
        const txId = 'tx_rec_' + rule.id + '_' + nextDue.replace(/-/g, '') + '_' + Math.random().toString(36).substring(2, 6);
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const dateParts = nextDue.split('-');
        const timestamp = new Date(
          Number(dateParts[0]),
          Number(dateParts[1]) - 1,
          Number(dateParts[2]),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds()
        ).getTime() || Date.now();

        const newTx: Transaction = {
          id: txId,
          amount: rule.amount,
          type: rule.type,
          date: nextDue,
          time,
          timestamp,
          categoryId: rule.categoryId,
          categoryName: rule.categoryName,
          subcategory: rule.subcategory,
          merchantName: rule.merchantName || rule.name,
          accountId: rule.accountId,
          accountName: rule.accountName,
          creditCardId: rule.creditCardId,
          creditCardName: rule.creditCardName,
          toAccountId: rule.toAccountId,
          toAccountName: rule.toAccountName,
          paymentAppId: rule.paymentAppId,
          paymentAppName: rule.paymentAppName,
          recurringId: rule.id,
          recurringName: rule.name,
          goalId: rule.goalId,
          isAutoRecorded: true,
          notes: rule.notes ? `${rule.notes} (Recurring: ${rule.name})` : `Auto-recorded recurring: ${rule.name}`,
          tags: Array.from(new Set([...(rule.tags || []), '#recurring', '#autorecord'])),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        newTransactions.push(newTx);
        generatedSummary.push({
          ruleId: rule.id,
          name: rule.name,
          amount: rule.amount,
          type: rule.type,
          date: nextDue,
          source: 'RECURRING',
        });
      }

      lastGen = nextDue;
      nextDue = calculateNextDueDate(nextDue, rule.frequency, rule.interval || 1);
      modified = true;
    }

    if (modified) {
      return {
        ...rule,
        nextDueDate: nextDue,
        lastGeneratedDate: lastGen,
        updatedAt: Date.now(),
      };
    }

    return rule;
  });

  // 2. Process Subscriptions (Auto-Record where enabled or by default)
  const updatedSubscriptions = subscriptionsList.map(sub => {
    if (!sub.isActive || sub.isDeleted || sub.autoRecord === false) {
      return sub;
    }

    let nextBill = sub.nextBillingDate;
    let lastGen = sub.lastGeneratedDate;
    let modified = false;
    let iterations = 0;
    const maxCatchup = 24;

    while (nextBill <= currentDateStr && iterations < maxCatchup) {
      iterations++;

      const alreadyExists = existingTransactions.some(
        t => !t.isDeleted && t.recurringId === sub.id && t.date === nextBill
      ) || newTransactions.some(
        t => t.recurringId === sub.id && t.date === nextBill
      );

      if (!alreadyExists) {
        const txId = 'tx_sub_' + sub.id + '_' + nextBill.replace(/-/g, '') + '_' + Math.random().toString(36).substring(2, 6);
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const dateParts = nextBill.split('-');
        const timestamp = new Date(
          Number(dateParts[0]),
          Number(dateParts[1]) - 1,
          Number(dateParts[2]),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds()
        ).getTime() || Date.now();

        const newTx: Transaction = {
          id: txId,
          amount: sub.amount,
          type: 'EXPENSE',
          date: nextBill,
          time,
          timestamp,
          categoryId: sub.categoryId || 'subscriptions',
          categoryName: sub.categoryName || 'Subscriptions',
          merchantName: sub.name,
          accountId: sub.accountId,
          accountName: sub.accountName,
          creditCardId: sub.creditCardId,
          creditCardName: sub.creditCardName,
          paymentAppId: sub.paymentAppId,
          paymentAppName: sub.paymentAppName,
          recurringId: sub.id,
          recurringName: sub.name,
          goalId: sub.goalId,
          isAutoRecorded: true,
          notes: sub.notes ? `${sub.notes} (Subscription: ${sub.name})` : `Auto-recorded subscription: ${sub.name}`,
          tags: ['#subscription', '#recurring', '#autorecord'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        newTransactions.push(newTx);
        generatedSummary.push({
          ruleId: sub.id,
          name: sub.name,
          amount: sub.amount,
          type: 'EXPENSE',
          date: nextBill,
          source: 'SUBSCRIPTION',
        });
      }

      lastGen = nextBill;
      nextBill = calculateNextDueDate(nextBill, sub.frequency, 1);
      modified = true;
    }

    if (modified) {
      return {
        ...sub,
        nextBillingDate: nextBill,
        lastGeneratedDate: lastGen,
      };
    }

    return sub;
  });

  return {
    updatedRecurring,
    updatedSubscriptions,
    newTransactions,
    generatedSummary,
  };
}

/**
 * Helper to get days remaining until due date.
 * Returns 0 if due today, negative if overdue, positive if in future.
 */
export function getDaysUntil(targetDateStr: string, fromDateStr: string = new Date().toISOString().substring(0, 10)): number {
  const target = new Date(targetDateStr + 'T00:00:00').getTime();
  const current = new Date(fromDateStr + 'T00:00:00').getTime();
  const diffDays = Math.round((target - current) / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format due status badge text and color theme.
 */
export function formatDueBadge(targetDateStr: string, fromDateStr: string = new Date().toISOString().substring(0, 10)): {
  label: string;
  color: string;
  isOverdue: boolean;
  isToday: boolean;
  days: number;
} {
  const days = getDaysUntil(targetDateStr, fromDateStr);

  if (days < 0) {
    return {
      label: `${Math.abs(days)}d overdue`,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      isOverdue: true,
      isToday: false,
      days,
    };
  }
  if (days === 0) {
    return {
      label: 'Due today',
      color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 animate-pulse',
      isOverdue: false,
      isToday: true,
      days,
    };
  }
  if (days === 1) {
    return {
      label: 'Due tomorrow',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      isOverdue: false,
      isToday: false,
      days,
    };
  }
  return {
    label: `In ${days} days`,
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    isOverdue: false,
    isToday: false,
    days,
  };
}

/**
 * Calculate total normalized monthly recurring commitments (expenses only)
 */
export function calculateMonthlyCommitment(
  recurringList: RecurringTransaction[],
  subscriptionsList: Subscription[]
): number {
  let total = 0;

  recurringList
    .filter(r => r.isActive && !r.isDeleted && (r.type === 'EXPENSE' || r.type === 'INVESTMENT_CONTRIBUTION' || r.type === 'LOAN_REPAYMENT'))
    .forEach(r => {
      const amt = r.amount || 0;
      switch (r.frequency) {
        case 'DAILY':
          total += amt * 30;
          break;
        case 'WEEKLY':
          total += (amt * 52) / 12;
          break;
        case 'MONTHLY':
          total += amt;
          break;
        case 'QUARTERLY':
          total += amt / 3;
          break;
        case 'HALF_YEARLY':
          total += amt / 6;
          break;
        case 'YEARLY':
          total += amt / 12;
          break;
      }
    });

  subscriptionsList
    .filter(s => s.isActive && !s.isDeleted)
    .forEach(s => {
      const amt = s.amount || 0;
      switch (s.frequency) {
        case 'DAILY':
          total += amt * 30;
          break;
        case 'WEEKLY':
          total += (amt * 52) / 12;
          break;
        case 'MONTHLY':
          total += amt;
          break;
        case 'QUARTERLY':
          total += amt / 3;
          break;
        case 'HALF_YEARLY':
          total += amt / 6;
          break;
        case 'YEARLY':
          total += amt / 12;
          break;
      }
    });

  return Math.round(total);
}

/**
 * Get upcoming occurrences list for preview (e.g. next 3 occurrences)
 */
export function getUpcomingOccurrences(
  startDate: string,
  frequency: RecurrenceFrequency,
  interval: number = 1,
  count: number = 3
): string[] {
  const result: string[] = [];
  let current = startDate;

  for (let i = 0; i < count; i++) {
    result.push(current);
    current = calculateNextDueDate(current, frequency, interval);
  }

  return result;
}
