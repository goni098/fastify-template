import { bigserial, json, pgTable, unique, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import type { z } from "zod"

export const eventTable = pgTable(
	"event",
	{
		id: bigserial({ mode: "number" }).primaryKey().notNull(),
		digest: varchar().notNull(),
		seq: varchar().notNull(),
		payload: json().notNull(),
		type: varchar().notNull(),
		timestamp: varchar()
	},
	table => [unique().on(table.digest, table.seq)]
)

export const eventInsertSchema = createInsertSchema(eventTable)

export type CreateEventInput = z.infer<typeof eventInsertSchema>
