require('dotenv').config();
const mongoose = require('mongoose');

const cleanDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ghostpost';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for database wipe...');
    await mongoose.connection.dropDatabase();
    console.log('Local MongoDB database ghostpost cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error wiping database:', error);
    process.exit(1);
  }
};

cleanDB();
