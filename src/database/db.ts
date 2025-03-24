import { DATABASE_URL } from "@root/shared/env.js"
import { drizzle } from "drizzle-orm/node-postgres"
import { eventTable } from "./schemas/event.schema.js"
import { renewTokenTable } from "./schemas/renew-token.schema.js"
import { settingTable } from "./schemas/setting.schema.js"
import { userTable } from "./schemas/user.schema.js"

export type Db = ReturnType<typeof establishConnection>

export const establishConnection = (logging = false) =>
	drizzle({
		schema: {
			user: userTable,
			event: eventTable,
			setting: settingTable,
			renewToken: renewTokenTable
		},
		connection: {
			connectionString: DATABASE_URL
		},
		logger: logging
	})
