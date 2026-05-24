const mongoose = require('mongoose');

const uri = 'mongodb://varunshettyv7_db_user:Heheboi2512@ac-4orincq-shard-00-00.brqi4ap.mongodb.net:27017,ac-4orincq-shard-00-01.brqi4ap.mongodb.net:27017,ac-4orincq-shard-00-02.brqi4ap.mongodb.net:27017/frames?ssl=true&replicaSet=atlas-9x1vzp-shard-0&authSource=admin&retryWrites=true&w=majority';

async function checkDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected.');
    
    const db = mongoose.connection.db;
    console.log('Current database name:', db.databaseName);
    
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(c => console.log(' - ' + c.name));
    
    // Check users
    const usersCount = await db.collection('users').countDocuments();
    console.log(`Total users in 'frames' db: ${usersCount}`);
    
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDB();
