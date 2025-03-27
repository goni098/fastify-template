import { pgTable, varchar } from "drizzle-orm/pg-core"
import { baseColumns } from "./_base.schema"

export const settingTable = pgTable("setting", {
	key: varchar().notNull().unique(),
	value: varchar().notNull(),
	...baseColumns
})
