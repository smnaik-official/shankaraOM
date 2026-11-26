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
