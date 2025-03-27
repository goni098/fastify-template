import { DATABASE_URL } from "@shared/env"
import { drizzle } from "drizzle-orm/node-postgres"
import { eventTable } from "./schemas/event.schema"
import { renewTokenTable } from "./schemas/renew-token.schema"
import { settingTable } from "./schemas/setting.schema"
import { userTable } from "./schemas/user.schema"

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
