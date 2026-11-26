import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { initialSeedData } from './seedData.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mail4mnaik_db_user:Vai104aCUFhuHmaB@shankaraom.2nepkoh.mongodb.net/shankara_admin_db?retryWrites=true&w=majority';
const DB_NAME = process.env.DB_NAME || 'shankara_admin_db';

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

let dbClient = null;
let db = null;
let connectionStatus = {
  connected: false,
  cluster: 'shankaraom.2nepkoh.mongodb.net',
  database: DB_NAME,
  connectedAt: null,
  error: null,
};

// Seed database if empty
async function seedCollections(database) {
  try {
    for (const [collectionName, data] of Object.entries(initialSeedData)) {
      const col = database.collection(collectionName);
      const count = await col.countDocuments();

      if (count === 0) {
        if (Array.isArray(data)) {
          if (data.length > 0) {
            await col.insertMany(data);
            console.log(`[Seed] Seeded ${data.length} records into '${collectionName}'`);
          }
        } else if (typeof data === 'object') {
          await col.insertOne(data);
          console.log(`[Seed] Seeded initial config into '${collectionName}'`);
        }
      }
    }
  } catch (seedErr) {
    console.error('[Seed Error] Failed to seed initial data:', seedErr.message);
  }
}

// Connect to MongoDB Atlas
async function initMongo() {
  try {
    console.log(`[MongoDB] Connecting to Atlas (${MONGODB_URI.split('@')[1].split('/')[0]})...`);
    dbClient = new MongoClient(MONGODB_URI);
    await dbClient.connect();
    db = dbClient.db(DB_NAME);

    connectionStatus.connected = true;
    connectionStatus.connectedAt = new Date().toISOString();
    connectionStatus.error = null;
    console.log(`[MongoDB] Successfully connected to database: ${DB_NAME}`);

    await seedCollections(db);
  } catch (err) {
    connectionStatus.connected = false;
    connectionStatus.error = err.message;
    console.error('[MongoDB] Connection error:', err.message);
  }
}

// Ensure database connection middleware
const requireDb = (req, res, next) => {
  if (!db || !connectionStatus.connected) {
    return res.status(503).json({
      error: 'MongoDB Atlas is currently unavailable',
      details: connectionStatus.error,
    });
  }
  next();
};

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: connectionStatus.connected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: connectionStatus,
  });
});

// Database Status & Diagnostics
app.get('/api/status', requireDb, async (req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    const stats = {};
    for (const col of collections) {
      stats[col.name] = await db.collection(col.name).countDocuments();
    }

    res.json({
      connected: true,
      cluster: connectionStatus.cluster,
      database: DB_NAME,
      collections: stats,
      connectedAt: connectionStatus.connectedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unified Sync: Get all collections
app.get('/api/sync/all', requireDb, async (req, res) => {
  try {
    const result = {};
    const collectionNames = [
      'invoices',
      'recurring_templates',
      'credit_notes',
      'clients',
      'expenses',
      'subscriptions',
      'compliances',
      'billing_profiles',
      'employees',
      'ad_ledger',
      'proposals',
    ];

    for (const name of collectionNames) {
      const docs = await db.collection(name).find({}).toArray();
      // Remove Mongo _id or map cleanly
      result[name] = docs.map(({ _id, ...rest }) => rest);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Collection: GET all records
app.get('/api/:collection', requireDb, async (req, res) => {
  try {
    const { collection } = req.params;
    const items = await db.collection(collection).find({}).toArray();
    const cleanItems = items.map(({ _id, ...rest }) => rest);

    // If billing_profiles, return single config object
    if (collection === 'billing_profiles' && cleanItems.length > 0) {
      return res.json(cleanItems[0]);
    }

    res.json(cleanItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Collection: GET single item by id
app.get('/api/:collection/:id', requireDb, async (req, res) => {
  try {
    const { collection, id } = req.params;
    const item = await db.collection(collection).findOne({ id });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const { _id, ...clean } = item;
    res.json(clean);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Collection: POST create or upsert single record
app.post('/api/:collection', requireDb, async (req, res) => {
  try {
    const { collection } = req.params;
    const payload = req.body;

    if (!payload) {
      return res.status(400).json({ error: 'Empty payload' });
    }

    const filter = payload.id ? { id: payload.id } : { _id: payload._id };
    await db.collection(collection).updateOne(
      filter,
      { $set: payload },
      { upsert: true }
    );

    res.status(201).json({ success: true, item: payload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Collection: PUT update record by id
app.put('/api/:collection/:id', requireDb, async (req, res) => {
  try {
    const { collection, id } = req.params;
    const payload = req.body;

    await db.collection(collection).updateOne(
      { id },
      { $set: payload },
      { upsert: true }
    );

    res.json({ success: true, id, updated: payload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Collection: DELETE record by id
app.delete('/api/:collection/:id', requireDb, async (req, res) => {
  try {
    const { collection, id } = req.params;
    const result = await db.collection(collection).deleteOne({ id });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Collection: POST batch replace/sync
app.post('/api/:collection/batch', requireDb, async (req, res) => {
  try {
    const { collection } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Expected an array of items' });
    }

    const col = db.collection(collection);
    await col.deleteMany({});
    if (items.length > 0) {
      await col.insertMany(items);
    }

    res.json({ success: true, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Express server
app.listen(PORT, async () => {
  console.log(`[Express] Backend API running at http://localhost:${PORT}`);
  await initMongo();
});
