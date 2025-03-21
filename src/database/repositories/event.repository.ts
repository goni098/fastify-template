import { DatabaseException } from "@root/exceptions/database.ex.js"
import type { Result } from "@root/types/result.type.js"
import { Effect as E } from "effect"
import type { Db } from "../db.js"
import { type CreateEventInput, event } from "../models/event.model.js"

export type Setting = "lastest_event_cursor"

export class EventRepository {
	constructor(private db: Db) {}

	save(params: CreateEventInput): Result<void, DatabaseException> {
		return E.tryPromise({
			try: () =>
				this.db
					.insert(event)
					.values(params)
					.onConflictDoNothing({ target: [event.digest, event.seq] }),
			catch: error => new DatabaseException({ error })
		}).pipe(E.asVoid)
	}
}
