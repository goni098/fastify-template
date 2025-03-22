import { pgTable, varchar } from "drizzle-orm/pg-core"

export const settingTable = pgTable("setting", {
	key: varchar().notNull().primaryKey(),
	value: varchar().notNull()
})
