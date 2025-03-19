import { DATABASE_URL } from "@root/shared/env.js"
import { drizzle } from "drizzle-orm/node-postgres"
import { user, userRelation } from "./models/user.model.js"
import { wallet, walletRelation } from "./models/wallet.model.js"

export type Db = ReturnType<typeof establishConnection>

export const establishConnection = (logging: boolean) =>
	drizzle({
		schema: {
			user,
			wallet,
			userRelation,
			walletRelation
		},
		connection: {
			connectionString: DATABASE_URL
		},
		logger: logging
	})
