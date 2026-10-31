import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medico';

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'production') throw error;
    console.warn('MongoDB is unavailable; local development will use temporary in-memory records.');
    return false;
  }
};
