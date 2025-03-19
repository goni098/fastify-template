import { relations } from "drizzle-orm"
import { bigserial, pgTable, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type { z } from "zod"
import { wallet } from "./wallet.model.js"

export const user = pgTable("user", {
	id: bigserial({ mode: "number" }).primaryKey().notNull(),
	name: varchar().notNull(),
	address: varchar()
})

export const userRelation = relations(user, ({ many }) => ({
	wallets: many(wallet)
}))

export const userSelectSchema = createSelectSchema(user)

export const userInsertSchema = createInsertSchema(user)

export type User = z.infer<typeof userSelectSchema>

export type CreateUserInput = z.infer<typeof userInsertSchema>
