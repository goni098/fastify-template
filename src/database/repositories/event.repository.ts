import { DatabaseException } from "@root/exceptions/database.ex.js"
import type { Result } from "@root/types/result.type.js"
import { Effect as E } from "effect"
import type { Db } from "../db.js"
import { type CreateEventInput, eventTable } from "../schemas/event.schema.js"

export class EventRepository {
	constructor(private db: Db) {}

	save(params: CreateEventInput): Result<void, DatabaseException> {
		return E.tryPromise({
			try: () =>
				this.db
					.insert(eventTable)
					.values(params)
					.onConflictDoNothing({ target: [eventTable.digest, eventTable.seq] }),
			catch: error => new DatabaseException({ error })
		}).pipe(E.asVoid)
	}
}
