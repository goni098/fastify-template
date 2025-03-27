import { bigint, pgTable, varchar } from "drizzle-orm/pg-core"
import { baseColumns } from "./_base.schema"

export const renewTokenTable = pgTable("renew_token", {
	userId: bigint("user_id", { mode: "number" }).unique().notNull(),
	token: varchar().notNull(),
	...baseColumns
})
