import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type DbInstance = ReturnType<typeof drizzle>
const globalForDb = globalThis as unknown as { db?: DbInstance }

function getDb(): DbInstance {
  if (globalForDb.db) return globalForDb.db
  const client = postgres(process.env.DATABASE_URL!, {
    max: 10,
    idle_timeout: 20,
    // Override password to handle special chars (e.g. '?') that break URL parsing
    ...(process.env.DATABASE_PASSWORD && { password: process.env.DATABASE_PASSWORD }),
  })
  const db = drizzle(client, { schema })
  globalForDb.db = db
  return db
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop) {
    return getDb()[prop as keyof DbInstance]
  },
})
