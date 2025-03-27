import { pgTable, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type { z } from "zod"
import { baseColumns } from "./_base.schema"

export const userTable = pgTable("user", {
	address: varchar().notNull().unique(),
	...baseColumns
})

export const userSelectSchema = createSelectSchema(userTable)

export const userInsertSchema = createInsertSchema(userTable)

export type User = z.infer<typeof userSelectSchema>

export type CreateUserInput = z.infer<typeof userInsertSchema>
