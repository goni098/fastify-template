import { DATABASE_URL } from "@root/shared/env.js"
import { drizzle } from "drizzle-orm/node-postgres"
import { event } from "./models/event.model.js"
import { setting } from "./models/setting.model.js"
import { user, userRelation } from "./models/user.model.js"
import { wallet, walletRelation } from "./models/wallet.model.js"

export type Db = ReturnType<typeof establishConnection>

export const establishConnection = (logging = false) =>
	drizzle({
		schema: {
			user,
			wallet,
			event,
			setting,
			userRelation,
			walletRelation
		},
		connection: {
			connectionString: DATABASE_URL
		},
		logger: logging
	})
