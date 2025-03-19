import type { Db } from "@root/database/db.js"

export type RepositoryFactory<R> = new (db: Db) => R
