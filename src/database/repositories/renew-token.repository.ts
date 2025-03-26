import type { DatabaseException } from "@root/exceptions/database.ex.js"
import type { Result } from "@root/types/result.type.js"
import { eq } from "drizzle-orm"
import { Effect as E } from "effect"
import type { NoSuchElementException } from "effect/Cause"
import { renewTokenTable } from "../schemas/renew-token.schema.js"
import { BaseRepository } from "./_base.repository.js"

export class RenewTokenRepository extends BaseRepository(renewTokenTable) {
	findTokenByUserId(
		userId: number
	): Result<string, DatabaseException | NoSuchElementException> {
		return this.findFirstBy(eq(renewTokenTable.userId, userId)).pipe(
			E.map(record => record.token)
		)
	}

	save(userId: number, token: string) {
		return this.insertOnConflictDoUpdate(
			{ token, userId },
			renewTokenTable.userId
		)
	}
}
