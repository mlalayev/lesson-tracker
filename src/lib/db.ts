import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not set in environment variables');
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectToDatabase() {
  if (!global._mongooseConn) {
    global._mongooseConn = mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB || 'lesson-tracker'
    });
  }
  return global._mongooseConn;
}


