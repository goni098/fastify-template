import type { EventId } from "@mysten/sui/client"
import { DatabaseException } from "@root/exceptions/database.ex.js"
import type { Result } from "@root/types/result.type.js"
import { eq } from "drizzle-orm"
import { Effect as E, Option as O, flow, pipe } from "effect"
import type { Db } from "../db.js"
import { setting } from "../schemas/setting.schema.js"

export type Setting = "lastest_event_seq" | "lastest_event_tx_didest"

export type EventCursor = EventId

export class SettingRepository {
	constructor(private db: Db) {}

	get(key: Setting): Result<O.Option<string>, DatabaseException> {
		return E.tryPromise({
			try: () =>
				this.db.query.setting.findFirst({
					where: eq(setting.key, key),
					columns: { value: true }
				}),
			catch: error => new DatabaseException({ error })
		}).pipe(
			E.map(
				flow(
					O.fromNullable,
					O.map(({ value }) => value)
				)
			)
		)
	}

	set(key: Setting, value: string): Result<string, DatabaseException> {
		return E.tryPromise({
			try: () =>
				this.db.update(setting).set({ value }).where(eq(setting.key, key)),
			catch: error => new DatabaseException({ error })
		}).pipe(
			E.flatMap(res =>
				E.tryPromise({
					try: () => this.db.insert(setting).values({ key, value }),
					catch: error => new DatabaseException({ error })
				}).pipe(E.when(() => res.rowCount === 0))
			),
			E.as(value)
		)
	}

	saveLastestCursor({
		eventSeq,
		txDigest
	}: EventId): Result<void, DatabaseException> {
		return pipe(
			E.tryPromise({
				try: () =>
					this.db.transaction(async tx => {
						tx.update(setting)
							.set({ key: "lastest_event_seq", value: eventSeq })
							.where(eq(setting.key, "lastest_event_seq"))

						tx.update(setting)
							.set({ key: "lastest_event_tx_didest", value: txDigest })
							.where(eq(setting.key, "lastest_event_tx_didest"))
					}),
				catch: error => new DatabaseException({ error })
			}),
			E.asVoid
		)
	}

	getLastestCursor(): Result<O.Option<EventCursor>, DatabaseException> {
		return pipe(
			this.get("lastest_event_seq"),
			E.zip(this.get("lastest_event_tx_didest")),
			E.map(([eventSeq, txDigest]) =>
				O.zipWith(eventSeq, txDigest, (eventSeq, txDigest) => ({
					eventSeq,
					txDigest
				}))
			)
		)
	}
}
