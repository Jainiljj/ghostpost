const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ghostpost';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB Connection failed (${error.message}).`);
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      try {
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/ghostpost');
        isConnected = true;
        console.log(`Local MongoDB Connected: ${localConn.connection.host}`);
      } catch (fallbackError) {
        console.error(`Database Connection Error: ${fallbackError.message}`);
      }
    }
  }
};

module.exports = connectDB;
