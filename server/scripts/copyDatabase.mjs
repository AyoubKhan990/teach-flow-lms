import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

function inferSourceTargetUris() {
  const targetUri = process.env.TARGET_MONGO_URI || process.env.MONGO_URI;
  const sourceUri = process.env.SOURCE_MONGO_URI;

  if (!targetUri) {
    throw new Error("Missing TARGET_MONGO_URI or MONGO_URI");
  }

  if (sourceUri) {
    return { sourceUri, targetUri };
  }

  const match = targetUri.match(/^(mongodb(?:\+srv)?:\/\/[^/]+\/)([^?]+)(\?.*)?$/i);
  if (!match) {
    throw new Error(
      "Unable to infer SOURCE_MONGO_URI from MONGO_URI. Provide SOURCE_MONGO_URI and TARGET_MONGO_URI explicitly."
    );
  }

  const prefix = match[1];
  const dbName = match[2];
  const suffix = match[3] || "";

  if (dbName.toLowerCase() === "learnstream") {
    return { sourceUri: targetUri, targetUri: `${prefix}teachflow${suffix}` };
  }
  if (dbName.toLowerCase() === "teachflow") {
    return { sourceUri: `${prefix}learnstream${suffix}`, targetUri };
  }

  throw new Error(
    `MONGO_URI points to '${dbName}'. Set SOURCE_MONGO_URI and TARGET_MONGO_URI to copy learnstream → teachflow.`
  );
}

function getOptions(uri) {
  const options = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 60000,
    maxPoolSize: 10,
    minPoolSize: 0,
  };
  const isLocal = /mongodb:\/\/(localhost|127\.0\.0\.1)/i.test(uri);
  if (isLocal || process.env.MONGO_FORCE_IPV4 === "true") {
    options.family = 4;
  }
  return options;
}

async function listCollectionNames(db) {
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  return collections
    .map((c) => c.name)
    .filter((name) => typeof name === "string" && !name.startsWith("system."));
}

async function copyIndexes({ sourceDb, targetDb, collectionName }) {
  const src = sourceDb.collection(collectionName);
  const tgt = targetDb.collection(collectionName);

  const indexes = await src.indexes();
  const toCreate = indexes
    .filter((idx) => idx?.name && idx.name !== "_id_")
    .map((idx) => {
      const { key, name, ...rest } = idx;
      const options = { name, ...rest };
      delete options.ns;
      delete options.v;
      return { key, name, ...options };
    });

  if (toCreate.length > 0) {
    await tgt.createIndexes(toCreate);
  }
}

async function copyCollection({ sourceDb, targetDb, collectionName }) {
  const src = sourceDb.collection(collectionName);
  const tgt = targetDb.collection(collectionName);

  await tgt.drop().catch(() => {});
  await targetDb.createCollection(collectionName).catch(() => {});

  const cursor = src.find({}, { batchSize: 1000 });

  let copied = 0;
  let batch = [];

  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= 500) {
      await tgt.insertMany(batch, { ordered: false });
      copied += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await tgt.insertMany(batch, { ordered: false });
    copied += batch.length;
  }

  await copyIndexes({ sourceDb, targetDb, collectionName });

  return copied;
}

async function main() {
  const { sourceUri, targetUri } = inferSourceTargetUris();

  const sourceConn = await mongoose.createConnection(sourceUri, getOptions(sourceUri)).asPromise();
  const targetConn = await mongoose.createConnection(targetUri, getOptions(targetUri)).asPromise();

  const sourceDb = sourceConn.db;
  const targetDb = targetConn.db;

  const sourceDbName = sourceDb.databaseName;
  const targetDbName = targetDb.databaseName;

  console.log(`Copying database '${sourceDbName}' → '${targetDbName}'`);

  const collections = await listCollectionNames(sourceDb);
  console.log(`Collections: ${collections.join(", ")}`);

  let totalCopied = 0;
  for (const name of collections) {
    const count = await sourceDb.collection(name).estimatedDocumentCount();
    console.log(`Copying ${name} (approx ${count})...`);
    const copied = await copyCollection({ sourceDb, targetDb, collectionName: name });
    console.log(`Copied ${name}: ${copied}`);
    totalCopied += copied;
  }

  console.log(`DONE. Total documents copied: ${totalCopied}`);
  await sourceConn.close();
  await targetConn.close();
}

main().catch((err) => {
  console.error("Copy failed", {
    name: err?.name,
    message: err?.message,
    code: err?.code,
    codeName: err?.codeName,
  });
  process.exit(1);
});

