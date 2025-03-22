import { DATABASE_URL } from "@root/shared/env.js"
import { drizzle } from "drizzle-orm/node-postgres"
import { event } from "./schemas/event.schema.js"
import { setting } from "./schemas/setting.schema.js"
import { user } from "./schemas/user.schema.js"

export type Db = ReturnType<typeof establishConnection>

export const establishConnection = (logging = false) =>
	drizzle({
		schema: {
			user,
			event,
			setting
		},
		connection: {
			connectionString: DATABASE_URL
		},
		logger: logging
	})
