const dns = require('dns');
const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ghostpost';
  if (mongoUri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (e) {
      // Fallback if setServers not supported
    }
  }

  try {
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB Connection failed (${error.message}).`);
    console.log('Falling back to local MongoDB at mongodb://127.0.0.1:27017/ghostpost...');
    try {
      const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/ghostpost');
      console.log(`Local MongoDB Connected: ${localConn.connection.host}`);
    } catch (fallbackError) {
      console.error(`Database Connection Error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

