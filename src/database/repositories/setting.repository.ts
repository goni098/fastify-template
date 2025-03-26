import type { EventId } from "@mysten/sui/client"
import type { DatabaseException } from "@root/exceptions/database.ex.js"
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
import { settingTable } from "../schemas/setting.schema.js"
import { BaseRepository } from "./_base.repository.js"

export type Setting = "lastest_event_seq" | "lastest_event_tx_didest"

export type EventCursor = EventId

export class SettingRepository extends BaseRepository(settingTable) {
	get(key: Setting): Result<O.Option<string>, DatabaseException> {
		return pipe(
			this.findFirstBy(eq(settingTable.key, key), {
				value: settingTable.value
			}),
			E.map(record => O.some(record.value)),
			E.catchAll(() => E.succeed(O.none<string>()))
		)
	}

	set(key: Setting, value: string): Result<string, DatabaseException> {
		return pipe(
			this.upsert(eq(settingTable.key, key), { key, value }),
			E.as(value)
		)
	}

	saveLastestCursor({
		eventSeq,
		txDigest
	}: EventId): Result<void, DatabaseException | NoRecordUpdatedException> {
		return pipe(
			this.$transaction(tx =>
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
			E.zip(this.get("lastest_event_tx_didest"), { concurrent: true }),
			E.map(([eventSeq, txDigest]) =>
				O.zipWith(eventSeq, txDigest, (eventSeq, txDigest) => ({
					eventSeq,
					txDigest
				}))
			)
		)
	}
}
