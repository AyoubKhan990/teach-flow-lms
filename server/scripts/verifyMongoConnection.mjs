import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is not set");
  process.exit(1);
}

const options = {
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 45000,
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 0),
};

const isLocal = /mongodb:\/\/(localhost|127\.0\.0\.1)/i.test(uri);
if (isLocal || process.env.MONGO_FORCE_IPV4 === "true") {
  options.family = 4;
}

try {
  await mongoose.connect(uri, options);
  await mongoose.connection.db.admin().ping();

  const dbName = mongoose.connection.db.databaseName;
  const collections = await mongoose.connection.db
    .listCollections({}, { nameOnly: true })
    .toArray();

  console.log("OK");
  console.log(`DB: ${dbName}`);
  console.log(
    `Collections (${collections.length}): ${collections
      .map((c) => c.name)
      .slice(0, 50)
      .join(", ")}${collections.length > 50 ? ", ..." : ""}`
  );

  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  const details = {
    name: err?.name,
    message: err?.message,
    code: err?.code,
    codeName: err?.codeName,
  };
  console.error("FAIL");
  console.error(JSON.stringify(details, null, 2));

  const hint =
    typeof err?.message === "string" &&
    (err.message.toLowerCase().includes("authentication failed") ||
      err.message.toLowerCase().includes("unauthorized") ||
      err?.code === 18)
      ? "Hint: Mongo auth is enabled. Update MONGO_URI to include username/password and authSource (often admin)."
      : "Hint: Check that mongod is running and the host/port is reachable.";
  console.error(hint);
  process.exit(1);
}

