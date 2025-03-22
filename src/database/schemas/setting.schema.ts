import { pgTable, varchar } from "drizzle-orm/pg-core"

export const setting = pgTable("settingTable", {
	key: varchar().notNull().primaryKey(),
	value: varchar().notNull()
})
