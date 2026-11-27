import { getStoredInvoices, getStoredRecurringTemplates } from './invoices';
import { getStoredExpenses, getStoredExpenseTemplates } from './expenses';
import { getStoredProposals } from './proposals';
import { getStoredSubscriptions, CURRENCY_SYMBOLS, getDaysUntilRenewal } from './subscriptions';
import { getStoredCompliances } from './compliance';
import { formatDateDMY } from '../utils/date';

export type NotificationType =
  | 'INVOICE_DUE'
  | 'SUBSCRIPTION_DUE'
  | 'PAYMENT_DUE'
  | 'PROPOSAL_FOLLOWUP'
  | 'COMPLIANCE_DUE';

export interface AlertNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  amount?: number;
  dueDate?: string;
  targetUrl: string;
  targetLabel: string;
  badgeText: string;
  severity: 'high' | 'medium' | 'info';
  category: string;
  timestamp: string;
  isRead?: boolean;
}

const READ_NOTIFICATIONS_STORAGE_KEY = 'shankara_read_notification_ids';

export const getReadNotificationIds = (): string[] => {
  try {
    const raw = localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const markNotificationAsRead = (id: string) => {
  try {
    const current = getReadNotificationIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('notifications-changed'));
    }
  } catch (e) {
    console.error('Failed to mark notification as read:', e);
  }
};

export const markAllNotificationsAsRead = (ids: string[]) => {
  try {
    const current = getReadNotificationIds();
    const updated = Array.from(new Set([...current, ...ids]));
    localStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('notifications-changed'));
  } catch (e) {
    console.error('Failed to mark all notifications as read:', e);
  }
};

export const clearReadNotifications = () => {
  try {
    localStorage.removeItem(READ_NOTIFICATIONS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('notifications-changed'));
  } catch (e) {
    console.error('Failed to clear read notifications:', e);
  }
};

export const getActiveNotifications = (targetMonth: string = '2026-11'): AlertNotification[] => {
  const invoices = getStoredInvoices();
  const recurringInvoices = getStoredRecurringTemplates();
  const expenseTemplates = getStoredExpenseTemplates();
  const expenses = getStoredExpenses();
  const readIds = new Set(getReadNotificationIds());

  const notifications: AlertNotification[] = [];

  // ==========================================
  // 1. INVOICES DUE TO BE RAISED
  // ==========================================
  recurringInvoices
    .filter((template) => template.isActive)
    .forEach((template) => {
      const alreadyGenerated = invoices.some(
        (inv) => inv.recurringTemplateId === template.id && inv.date.startsWith(targetMonth)
      );

      if (!alreadyGenerated) {
        const notifId = `notif-inv-${template.id}-${targetMonth}`;
        const templateTotal = Number(template.total) || 0;
        notifications.push({
          id: notifId,
          type: 'INVOICE_DUE',
          title: `Retainer Invoice Due: ${template.clientName}`,
          message: `${template.title} (₹${templateTotal.toLocaleString()}) is scheduled for Day ${template.dayOfMonth} and is due to be raised.`,
          amount: templateTotal,
          dueDate: `Day ${template.dayOfMonth} (${targetMonth})`,
          targetUrl: '/invoices?tab=recurring',
          targetLabel: 'Raise Retainer Invoice',
          badgeText: 'Invoice Due',
          severity: 'high',
          category: 'Client Invoicing',
          timestamp: `${targetMonth}-${String(template.dayOfMonth).padStart(2, '0')}`,
          isRead: readIds.has(notifId),
        });
      }
    });

  // ==========================================
  // 2. SUBSCRIPTIONS DUE TO BE RENEWED
  // ==========================================
  const subscriptions = getStoredSubscriptions();
  subscriptions
    .filter((sub) => sub.status !== 'Paused' && sub.status !== 'Cancelled')
    .forEach((sub) => {
      const days = getDaysUntilRenewal(sub.renewalDate);
      // If due within 30 days or overdue
      if (days <= 30) {
        const notifId = `notif-sub-${sub.id}-${sub.renewalDate}`;
        const symbol = CURRENCY_SYMBOLS[sub.currency] || '₹';
        const subAmount = Number(sub.amount) || 0;
        const ownershipLabel = sub.ownership === 'Company' ? 'Company (Self)' : `Client: ${sub.clientName || 'Client'}`;
        const isOverdue = days < 0;

        notifications.push({
          id: notifId,
          type: 'SUBSCRIPTION_DUE',
          title: `Subscription Renewal: ${sub.name}`,
          message: `${sub.billingDuration} subscription for ${ownershipLabel} (${symbol}${subAmount.toLocaleString()}) ${
            isOverdue ? `is overdue by ${Math.abs(days)} days!` : `renews on ${formatDateDMY(sub.renewalDate)}.`
          }`,
          amount: subAmount,
          dueDate: formatDateDMY(sub.renewalDate),
          targetUrl: '/subscriptions',
          targetLabel: 'Manage Renewal',
          badgeText: isOverdue ? 'Renewal Overdue' : 'Renewal Due',
          severity: isOverdue ? 'high' : 'medium',
          category: 'Subscriptions',
          timestamp: sub.renewalDate,
          isRead: readIds.has(notifId),
        });
      }
    });

  // ==========================================
  // 3. PAYMENTS DUE TO BE PAID
  // ==========================================
  // 3a. Client receivables awaiting collection / payment
  invoices
    .filter((inv) => inv.status === 'Pending')
    .forEach((inv) => {
      const notifId = `notif-pay-inv-${inv.id}`;
      notifications.push({
        id: notifId,
        type: 'PAYMENT_DUE',
        title: `Payment Pending: Invoice #${inv.id}`,
        message: `₹${inv.amount.toLocaleString()} from ${inv.client} is pending payment (Billed: ${inv.date}).`,
        amount: inv.amount,
        dueDate: inv.date,
        targetUrl: '/invoices?tab=ledger&status=Pending',
        targetLabel: 'View Pending Invoice',
        badgeText: 'Receivable Due',
        severity: 'high',
        category: 'Client Receivables',
        timestamp: inv.date,
        isRead: readIds.has(notifId),
      });
    });

  // 3b. Essential recurring expense commitments (Payroll, Office Rent, Compliance) due for disbursement
  expenseTemplates
    .filter((template) => template.isActive)
    .forEach((template) => {
      const isEssentialCommitment =
        template.category === 'Payroll' ||
        template.category === 'Office' ||
        template.category === 'Operations';

      if (isEssentialCommitment) {
        const alreadyDisbursed = expenses.some(
          (e) => e.isRecurring && e.recurringTemplateId === template.id && e.date.startsWith(targetMonth)
        );

        if (!alreadyDisbursed) {
          const notifId = `notif-pay-exp-${template.id}-${targetMonth}`;
          notifications.push({
            id: notifId,
            type: 'PAYMENT_DUE',
            title: `Payment Due: ${template.title}`,
            message: `${template.notes || template.title} (₹${template.amount.toLocaleString()}) is scheduled on Day ${template.dayOfMonth} and due for payment.`,
            amount: template.amount,
            dueDate: `Day ${template.dayOfMonth} (${targetMonth})`,
            targetUrl: '/expenses?tab=templates',
            targetLabel: 'Disburse Payment',
            badgeText: 'Outflow Due',
            severity: 'high',
            category: 'Operating Outflows',
            timestamp: `${targetMonth}-${String(template.dayOfMonth).padStart(2, '0')}`,
            isRead: readIds.has(notifId),
          });
        }
      }
    });

  // ==========================================
  // 4. PROPOSALS & QUOTES FOLLOW-UP / CLOSING
  // ==========================================
  const proposals = getStoredProposals();
  proposals.forEach((prop) => {
    const propVal = Number(prop.tentativeValue) || 0;
    const propCloseDate = prop.expectedCloseDate || '';
    const propTitle = prop.serviceTitle || 'Proposal';
    if (prop.status === 'Accepted' && !prop.convertedInvoiceId) {
      const notifId = `notif-prop-accepted-${prop.id}`;
      notifications.push({
        id: notifId,
        type: 'PROPOSAL_FOLLOWUP',
        title: `Proposal Won: ${prop.clientName}`,
        message: `Quote for ${propTitle} (₹${propVal.toLocaleString()}) was accepted. Ready to raise invoice!`,
        amount: propVal,
        dueDate: propCloseDate,
        targetUrl: '/proposals',
        targetLabel: 'Raise Invoice from Quote',
        badgeText: 'Quote Won',
        severity: 'high',
        category: 'Client Proposals',
        timestamp: propCloseDate,
        isRead: readIds.has(notifId),
      });
    } else if (
      (prop.status === 'Under Review' || prop.status === 'Sent to Client') &&
      propCloseDate.startsWith(targetMonth)
    ) {
      const notifId = `notif-prop-close-${prop.id}`;
      notifications.push({
        id: notifId,
        type: 'PROPOSAL_FOLLOWUP',
        title: `Quote Follow-up: ${prop.clientName}`,
        message: `${propTitle} (₹${propVal.toLocaleString()}) expected to close by ${propCloseDate}.`,
        amount: propVal,
        dueDate: propCloseDate,
        targetUrl: '/proposals',
        targetLabel: 'View Proposal Pipeline',
        badgeText: 'Quote Closing',
        severity: 'medium',
        category: 'Income Forecast',
        timestamp: propCloseDate,
        isRead: readIds.has(notifId),
      });
    }
  });

  // ==========================================
  // 5. STATUTORY & PERSONAL COMPLIANCE DEADLINES
  // ==========================================
  try {
    const compliances = getStoredCompliances();
    compliances.forEach((comp) => {
      if (comp.status === 'overdue') {
        const notifId = `notif-comp-overdue-${comp.id}`;
        notifications.push({
          id: notifId,
          type: 'COMPLIANCE_DUE',
          title: `Overdue Compliance: ${comp.code}`,
          message: `${comp.title} (${comp.entityName}) was due on ${formatDateDMY(comp.dueDate)} (${comp.daysOverdue} days overdue). Accruing penalties!`,
          dueDate: comp.dueDate,
          targetUrl: '/compliance',
          targetLabel: 'Open Compliance Calendar',
          badgeText: `${comp.daysOverdue}d Overdue`,
          severity: 'high',
          category: 'Statutory Compliance',
          timestamp: comp.dueDate,
          isRead: readIds.has(notifId),
        });
      } else if (comp.status === 'due_soon') {
        const notifId = `notif-comp-duesoon-${comp.id}`;
        notifications.push({
          id: notifId,
          type: 'COMPLIANCE_DUE',
          title: `Compliance Due Soon: ${comp.code}`,
          message: `${comp.title} (${comp.entityName}) is due on ${formatDateDMY(comp.dueDate)} (${comp.daysUntilDue} days remaining).`,
          dueDate: comp.dueDate,
          targetUrl: '/compliance',
          targetLabel: 'Open Compliance Calendar',
          badgeText: `Due in ${comp.daysUntilDue}d`,
          severity: 'medium',
          category: 'Statutory Compliance',
          timestamp: comp.dueDate,
          isRead: readIds.has(notifId),
        });
      }
    });
  } catch (e) {
    console.error('Failed to load compliance notifications:', e);
  }

  return notifications;
};
