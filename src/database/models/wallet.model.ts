import { relations } from "drizzle-orm"
import { bigint, bigserial, pgTable, varchar } from "drizzle-orm/pg-core"
import { user } from "./user.model.js"

export const wallet = pgTable("wallet", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	address: varchar({ length: 64 }).unique().notNull(),
	ownerId: bigint("owner_id", { mode: "bigint" }).notNull()
})

export const walletRelation = relations(wallet, ({ one }) => ({
	owner: one(user, {
		fields: [wallet.ownerId],
		references: [user.id]
	})
}))
