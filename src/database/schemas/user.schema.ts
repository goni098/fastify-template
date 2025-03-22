import { bigserial, pgTable, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

export const user = pgTable("user", {
	id: bigserial({ mode: "number" }).primaryKey().notNull(),
	address: varchar().notNull().unique()
})

export const userSelectSchema = createSelectSchema(user)

export const userInsertSchema = createInsertSchema(user)

export type User = z.infer<typeof userSelectSchema>

export type CreateUserInput = z.infer<typeof userInsertSchema>
