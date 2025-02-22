import { Surreal } from "surrealdb";

// Environment variables for SurrealDB connection
const DB_URL =
  process.env.DB_URL ||
  "wss://dynamic-gull-06ad1bhg19u4vfrl4pqnil6o08.aws-use1.surreal.cloud";
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASS || "root";
const DB_NAME = process.env.DB_NAME || "chat";
const DB_NAMESPACE = process.env.DB_NAMESPACE || "test";

// Singleton instance to cache the database connection
let dbInstance: Surreal | null = null;

/**
 * Get or initialize a SurrealDB connection.
 *
 * This function establishes a connection to SurrealDB if it hasn't been initialized yet.
 * If the connection already exists, it returns the cached instance.
 *
 * @returns {Promise<Surreal>} The SurrealDB instance.
 * @throws Will throw an error if the connection or authentication fails.
 */
export async function sdb(): Promise<Surreal> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = new Surreal();
  try {
    await db.connect(DB_URL);

    await db.signin({
      username: DB_USER,
      password: DB_PASS,
    });

    await db.use({
      namespace: DB_NAMESPACE,
      database: DB_NAME,
    });

    dbInstance = db;
    return db;
  } catch (error) {
    throw error;
  }
}

export default sdb;
