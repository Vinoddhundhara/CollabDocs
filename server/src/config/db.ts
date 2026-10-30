import mongoose from 'mongoose';
import { config } from './env';

let isConnected = false;

export const connectDatabase = async (): Promise<boolean> => {
  if (!config.mongodbUri) {
    console.error(
      '\n❌ [Database Configuration Error]: MONGODB_URI is not set in the environment!\n' +
      'Please configure MONGODB_URI in server/.env or your environment variables.\n' +
      'Example: MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/collabdocs?retryWrites=true&w=majority\n'
    );
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    isConnected = true;
    console.log(`✅ [Database]: Successfully connected to MongoDB at ${config.mongodbUri.replace(/\/\/.*@/, '//<credentials>@')}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error('❌ [Database Connection Error]: Failed to connect to MongoDB:', (error as Error).message);
    return false;
  }
};

export const getDbStatus = () => {
  const readyState = mongoose.connection.readyState;
  // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    connected: readyState === 1,
    status: stateMap[readyState] || 'unknown',
    uriConfigured: Boolean(config.mongodbUri),
  };
};

export const disconnectDatabase = async (): Promise<void> => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
};
