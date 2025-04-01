import type { DatabaseException } from "@exceptions/database.ex.js"
import { NoRecordUpdatedException } from "@exceptions/no-record-updated.ex.js"
import type { EventId } from "@mysten/sui/client"
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
import type { Result } from "#types/result.type.js"
import { settingTable } from "../schemas/setting.schema.js"
import { BaseRepository } from "./_base.repository.js"

export type Setting = "lastest_event_seq" | "lastest_event_tx_didest"

export type EventCursor = EventId

export class SettingRepository extends BaseRepository(settingTable) {
	get(key: Setting): Result<O.Option<string>, DatabaseException> {
		return pipe(
			this.findFirst({
				filter: eq(settingTable.key, key)
			}),
			E.map(record => O.some(record.value)),
			E.catchTag("NoSuchElementException", () => E.succeed(O.none<string>()))
		)
	}

	set(key: Setting, value: string): Result<string, DatabaseException> {
		return pipe(
			this.upsert({
				data: {
					key,
					value
				},
				where: eq(settingTable.key, key)
			}),
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
