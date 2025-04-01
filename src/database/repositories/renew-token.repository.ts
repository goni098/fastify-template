import type { DatabaseException } from "@exceptions/database.ex.js"
import { eq } from "drizzle-orm"
import { Effect as E, pipe } from "effect"
import type { NoSuchElementException } from "effect/Cause"
import type { Result } from "#types/result.type.js"
import { renewTokenTable } from "../schemas/renew-token.schema.js"
import { BaseRepository } from "./_base.repository.js"

export class RenewTokenRepository extends BaseRepository(renewTokenTable) {
	findTokenByUserId(
		userId: number
	): Result<string, DatabaseException | NoSuchElementException> {
		return pipe(
			this.findFirst({
				filter: eq(renewTokenTable.userId, userId),
				select: {
					token: renewTokenTable.token
				}
			}),
			E.map(record => record.token)
		)
	}

	save(userId: number, token: string) {
		return this.insertOnConflictDoUpdate({
			data: {
				token,
				userId
			},
			conflict: renewTokenTable.userId
		})
	}
}
