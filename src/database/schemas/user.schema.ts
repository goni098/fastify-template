import { bigserial, pgTable, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

export const userTable = pgTable("user", {
	id: bigserial({ mode: "number" }).primaryKey().notNull(),
	address: varchar().notNull().unique()
})

export const userSelectSchema = createSelectSchema(userTable)

export const userInsertSchema = createInsertSchema(userTable)

export type User = z.infer<typeof userSelectSchema>

export type CreateUserInput = z.infer<typeof userInsertSchema>
