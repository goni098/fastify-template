import { bigint, pgTable, varchar } from "drizzle-orm/pg-core"

export const renewTokenTable = pgTable("renew_token", {
	userId: bigint("user_id", { mode: "number" }).primaryKey(),
	token: varchar().notNull()
})
