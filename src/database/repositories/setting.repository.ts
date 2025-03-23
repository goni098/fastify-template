import type { EventId } from "@mysten/sui/client"
import { DatabaseException } from "@root/exceptions/database.ex.js"
import { NoRecordUpdatedException } from "@root/exceptions/no-record-updated.ex.js"
import type { Result } from "@root/types/result.type.js"
import { eq } from "drizzle-orm"
import {
	Array as A,
	Boolean as B,
	Effect as E,
	Option as O,
	flow,
	pipe
} from "effect"
import { constant } from "effect/Function"
import type { Db } from "../db.js"
import { settingTable } from "../schemas/setting.schema.js"

export type Setting = "lastest_event_seq" | "lastest_event_tx_didest"

export type EventCursor = EventId

export class SettingRepository {
	constructor(private db: Db) {}

	get(key: Setting): Result<O.Option<string>, DatabaseException> {
		return E.tryPromise({
			try: () =>
				this.db.query.setting.findFirst({
					where: eq(settingTable.key, key),
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
				this.db
					.update(settingTable)
					.set({ value })
					.where(eq(settingTable.key, key)),
			catch: error => new DatabaseException({ error })
		}).pipe(
			E.flatMap(res =>
				E.tryPromise({
					try: () => this.db.insert(settingTable).values({ key, value }),
					catch: error => new DatabaseException({ error })
				}).pipe(E.when(() => res.rowCount === 0))
			),
			E.as(value)
		)
	}

	saveLastestCursor({
		eventSeq,
		txDigest
	}: EventId): Result<void, DatabaseException | NoRecordUpdatedException> {
		return pipe(
			E.tryPromise({
				try: () =>
					this.db.transaction(tx =>
						Promise.all([
							tx
								.update(settingTable)
								.set({ key: "lastest_event_seq", value: eventSeq })
								.where(eq(settingTable.key, "lastest_event_seq")),
							tx
								.update(settingTable)
								.set({ key: "lastest_event_tx_didest", value: txDigest })
								.where(eq(settingTable.key, "lastest_event_tx_didest"))
						])
					),
				catch: error => new DatabaseException({ error })
			}),
			E.flatMap(
				flow(
					A.every(result => Number(result.rowCount) > 0),
					B.match({
						onTrue: constant(E.void),
						onFalse: constant(E.fail(new NoRecordUpdatedException()))
					})
				)
			)
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
