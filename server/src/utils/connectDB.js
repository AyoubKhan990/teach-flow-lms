// server/src/utils/connectDB.js
import mongoose from "mongoose";

function getMongooseConnectOptions(uri) {
  const options = {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 0),
  };

  const isLocalUri = typeof uri === "string" && /mongodb:\/\/(localhost|127\.0\.0\.1)/i.test(uri);
  const forceIpv4 = process.env.MONGO_FORCE_IPV4 === "true";
  if (isLocalUri || forceIpv4) {
    options.family = 4;
  }

  return options;
}

async function connectWithRetry({ uri, attempts, delayMs }) {
  let lastError;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const conn = await mongoose.connect(uri, getMongooseConnectOptions(uri));
      return conn;
    } catch (err) {
      lastError = err;
      const details = {
        name: err?.name,
        message: err?.message,
        code: err?.code,
        codeName: err?.codeName,
      };
      console.error(`❌ MongoDB connection attempt ${i}/${attempts} failed`, details);
      if (i < attempts) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError;
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set");
  }

  try {
    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connection event: connected");
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB connection event: disconnected");
    });
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection event: error", err?.message || err);
    });

    const conn = await connectWithRetry({ uri, attempts: 3, delayMs: 1500 });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Failed", error?.message || error);
    throw error;
  }
};

export default connectDB;
