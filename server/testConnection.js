import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://mail4mnaik_db_user:Vai104aCUFhuHmaB@shankaraom.2nepkoh.mongodb.net/?retryWrites=true&w=majority';

async function testConnection() {
  const client = new MongoClient(uri);
  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('Successfully connected to MongoDB Atlas!');
    const dbs = await client.db().admin().listDatabases();
    console.log('Databases available:', dbs.databases.map(d => d.name));
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
  } finally {
    await client.close();
  }
}

testConnection();
