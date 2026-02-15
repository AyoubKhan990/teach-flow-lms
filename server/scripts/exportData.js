import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const exportData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    const data = {};

    for (const collection of collections) {
      const name = collection.name;
      const documents = await mongoose.connection.db.collection(name).find({}).toArray();
      data[name] = documents;
      console.log(`Exported ${documents.length} documents from ${name}`);
    }

    const outputPath = path.join(__dirname, '../../database_dump.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Data exported to ${outputPath}`);

    process.exit(0);
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
};

exportData();
