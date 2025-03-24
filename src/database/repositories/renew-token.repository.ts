import { DatabaseException } from "@root/exceptions/database.ex.js"
import type { Result } from "@root/types/result.type.js"
import { eq } from "drizzle-orm"
import { Effect as E } from "effect"
import type { NoSuchElementException } from "effect/Cause"
import type { Db } from "../db.js"
import { renewTokenTable } from "../schemas/renew-token.schema.js"

export class RenewTokenRepository {
	constructor(private db: Db) {}

	save(userId: number, token: string): Result<void, DatabaseException> {
		return E.tryPromise({
			try: () =>
				this.db
					.insert(renewTokenTable)
					.values({ token, userId })
					.onConflictDoUpdate({
						set: { token },
						target: renewTokenTable.userId
					}),
			catch: error => new DatabaseException({ error })
		})
	}

	findTokenByUserId(
		userId: number
	): Result<string, DatabaseException | NoSuchElementException> {
		return E.tryPromise({
			try: () =>
				this.db.query.renewToken.findFirst({
					where: eq(renewTokenTable.userId, userId)
				}),
			catch: error => new DatabaseException({ error })
		}).pipe(
			E.flatMap(E.fromNullable),
			E.map(({ token }) => token)
		)
	}
}
