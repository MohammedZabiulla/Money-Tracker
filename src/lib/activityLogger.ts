import {
  ActivityLog,
  ActivityDomain,
  ActivityActionType,
  ActivityChangeDetail,
} from '../types';
import { formatINR } from './currency';

/**
 * Creates a normalized ActivityLog entry
 */
export function createActivityEntry(
  domain: ActivityDomain,
  action: ActivityActionType,
  summary: string,
  options?: {
    entityId?: string;
    entityName?: string;
    details?: ActivityChangeDetail[];
    metadata?: Record<string, any>;
  }
): ActivityLog {
  const now = new Date();
  const date = now.toISOString().substring(0, 10);
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  return {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: Date.now(),
    date,
    time,
    domain,
    action,
    entityId: options?.entityId,
    entityName: options?.entityName,
    summary,
    details: options?.details && options.details.length > 0 ? options.details : undefined,
    metadata: options?.metadata,
  };
}

/**
 * Computes field-by-field diffs between an existing object and requested updates
 */
export function computeFieldDiffs(
  oldObj: Record<string, any>,
  updates: Record<string, any>,
  fieldLabels: Record<string, string> = {}
): ActivityChangeDetail[] {
  const diffs: ActivityChangeDetail[] = [];
  const ignoredKeys = new Set(['updatedAt', 'timestamp', 'createdAt', 'id', 'calculatedBalance', 'usageCount']);

  for (const key of Object.keys(updates)) {
    if (ignoredKeys.has(key)) continue;

    const oldVal = oldObj[key];
    const newVal = updates[key];

    if (newVal === undefined) continue;

    // Compare values (shallow or serialized for arrays/objects)
    const isDifferent =
      typeof oldVal === 'object' || typeof newVal === 'object'
        ? JSON.stringify(oldVal) !== JSON.stringify(newVal)
        : oldVal !== newVal;

    if (isDifferent) {
      diffs.push({
        field: key,
        label: fieldLabels[key] || formatFieldLabel(key),
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  return diffs;
}

function formatFieldLabel(key: string): string {
  // Convert camelCase to Title Case (e.g. isPinEnabled -> PIN Enabled)
  const result = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
  return result;
}

/**
 * Generates field diffs specifically for transaction updates with formatted currency
 */
export function computeTransactionDiffs(
  oldTx: Record<string, any>,
  updates: Record<string, any>
): ActivityChangeDetail[] {
  const labels: Record<string, string> = {
    amount: 'Amount',
    type: 'Transaction Type',
    date: 'Date',
    time: 'Time',
    categoryName: 'Category',
    subcategory: 'Subcategory',
    merchantName: 'Payee / Merchant',
    accountName: 'Account',
    toAccountName: 'Destination Account',
    creditCardName: 'Credit Card',
    paymentAppName: 'Payment App',
    notes: 'Notes',
    tags: 'Tags',
    debtPersonName: 'Person (Debt/Lent)',
    debtDueDate: 'Debt Due Date',
  };

  const rawDiffs = computeFieldDiffs(oldTx, updates, labels);
  return rawDiffs.map(d => {
    if (d.field === 'amount') {
      return {
        ...d,
        oldValue: d.oldValue !== undefined ? formatINR(Number(d.oldValue)) : undefined,
        newValue: d.newValue !== undefined ? formatINR(Number(d.newValue)) : undefined,
      };
    }
    return d;
  });
}

/**
 * Formats a relative timestamp (e.g. "Just now", "5 mins ago", "Today at 03:30 PM", "Aug 24 at 10:15 AM")
 */
export function formatActivityTimestamp(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) {
    const d = new Date(timestamp);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `Today at ${timeStr}`;
  }

  const d = new Date(timestamp);
  const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} at ${timeStr}`;
}
