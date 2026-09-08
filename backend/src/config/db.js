import mongoose from 'mongoose';

let cachedConn = null;

export const connectDB = async () => {
  // If already connected, return existing connection immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, await cached promise
  if (cachedConn) {
    try {
      await cachedConn;
      if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
      }
    } catch (err) {
      cachedConn = null;
    }
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/thinkquiz';

  console.log('[MongoDB]: Initiating connection to MongoDB Atlas...');
  cachedConn = mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    const conn = await cachedConn;
    console.log(`[MongoDB Connected]: Successfully connected to host '${conn.connection.host}'!`);
    return conn.connection;
  } catch (error) {
    cachedConn = null;
    console.error(`[MongoDB Connection Failed]: ${error.message}`);
    throw error;
  }
};
