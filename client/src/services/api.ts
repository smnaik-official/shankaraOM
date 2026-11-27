// Frontend API Service for MongoDB Atlas Backend

export interface DatabaseStatus {
  connected: boolean;
  cluster: string;
  database: string;
  pingMs?: number;
  lastChecked: string;
  collections?: Record<string, number>;
  error?: string;
}

const rawApiUrl = (import.meta as any).env?.VITE_API_URL;
const API_BASE = rawApiUrl ? `${rawApiUrl.replace(/\/$/, '')}/api` : '/api';

// Check connection to MongoDB Atlas
export async function checkDatabaseHealth(): Promise<DatabaseStatus> {
  const start = performance.now();
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    const pingMs = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json();
      return {
        connected: data.database?.connected ?? true,
        cluster: data.database?.cluster ?? 'shankaraom.2nepkoh.mongodb.net',
        database: data.database?.database ?? 'shankara_admin_db',
        pingMs,
        lastChecked: new Date().toLocaleTimeString(),
        error: data.database?.error ?? undefined,
      };
    } else {
      return {
        connected: false,
        cluster: 'shankaraom.2nepkoh.mongodb.net',
        database: 'shankara_admin_db',
        pingMs,
        lastChecked: new Date().toLocaleTimeString(),
        error: `Server responded with ${res.status}`,
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      cluster: 'shankaraom.2nepkoh.mongodb.net',
      database: 'shankara_admin_db',
      lastChecked: new Date().toLocaleTimeString(),
      error: err.message || 'Cannot reach backend server',
    };
  }
}

// Fetch all items from a collection
export async function apiGetCollection<T = any>(collection: string, fallbackData: T[]): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE}/${collection}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn(`[Cloud Sync] Using local cache for ${collection}:`, err);
  }
  return fallbackData;
}

// Save or update an item in MongoDB
export async function apiSaveItem<T = any>(collection: string, item: T): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.ok;
  } catch (err) {
    console.error(`[Cloud Save Error] ${collection}:`, err);
    return false;
  }
}

// Delete an item from MongoDB
export async function apiDeleteItem(collection: string, id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/${collection}/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error(`[Cloud Delete Error] ${collection}:`, err);
    return false;
  }
}

// Batch replace/update a whole collection
export async function apiBatchSave<T = any>(collection: string, items: T[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/${collection}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    return res.ok;
  } catch (err) {
    console.error(`[Cloud Batch Error] ${collection}:`, err);
    return false;
  }
}

// Synchronize all data from MongoDB into local state
export async function syncAllFromMongo(): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(`${API_BASE}/sync/all`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[Cloud Sync All Error]:', err);
  }
  return null;
}

// Storage Key Mappings matching each module's localStorage key
export const COLLECTION_KEYS: Record<string, string> = {
  invoices: 'invoice_admin_invoices',
  recurring_templates: 'invoice_admin_recurring_invoices',
  credit_notes: 'invoice_admin_credit_notes',
  clients: 'invoice_admin_clients',
  expenses: 'shankara_expenses_data',
  recurring_expense_templates: 'shankara_recurring_expense_templates',
  subscriptions: 'shankara_subscriptions_data',
  compliances: 'shankara_compliance_calendar_records',
  billing_profiles: 'invoice_admin_billing_profiles',
  employees: 'shankara_employees_data',
  ad_ledger: 'shankara_ad_ledger_data',
  proposals: 'shankara_proposals_data',
  quotations: 'shankara_quotations_data',
};

export const COLLECTION_EVENTS: Record<string, string> = {
  invoices: 'invoices_updated',
  recurring_templates: 'recurring_invoices_updated',
  credit_notes: 'credit_notes_updated',
  clients: 'clients_updated',
  expenses: 'expenses_updated',
  recurring_expense_templates: 'expense_templates_updated',
  subscriptions: 'subscriptions_updated',
  compliances: 'compliance_updated',
  billing_profiles: 'billing_profiles_updated',
  employees: 'employees_updated',
  ad_ledger: 'ad_ledger_updated',
  proposals: 'proposals-changed',
  quotations: 'quotations_updated',
};

// Pull authoritative state from MongoDB Atlas on app load / manual re-sync
export async function initializeCloudSync(): Promise<void> {
  try {
    const status = await checkDatabaseHealth();
    if (!status.connected) {
      console.warn('[Cloud Sync] Backend or MongoDB Atlas is offline. Running in local cache mode.');
      return;
    }

    const remoteData = await syncAllFromMongo();
    if (!remoteData) return;

    for (const [collection, key] of Object.entries(COLLECTION_KEYS)) {
      const remoteItems = remoteData[collection];
      if (remoteItems === undefined) continue;

      if (collection === 'billing_profiles') {
        const profileObj = Array.isArray(remoteItems) ? remoteItems[0] : remoteItems;
        if (profileObj && typeof profileObj === 'object' && profileObj.company) {
          localStorage.setItem(key, JSON.stringify(profileObj));
          const evt = COLLECTION_EVENTS[collection];
          if (evt) window.dispatchEvent(new Event(evt));
        }
        continue;
      }

      if (Array.isArray(remoteItems)) {
        // MongoDB Atlas is the source of truth; preserve empty arrays so deleted items stay deleted
        localStorage.setItem(key, JSON.stringify(remoteItems));
        const evt = COLLECTION_EVENTS[collection];
        if (evt) {
          window.dispatchEvent(new Event(evt));
        }
      }
    }
    window.dispatchEvent(new CustomEvent('notifications-changed'));
    console.log('[Cloud Sync] Synchronized with MongoDB Atlas.');
  } catch (err) {
    console.error('[Cloud Sync] Initialization error:', err);
  }
}
