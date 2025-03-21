import type { EventId } from "@mysten/sui/client"
import { DatabaseException } from "@root/exceptions/database.ex.js"
import type { Result } from "@root/types/result.type.js"
import { eq } from "drizzle-orm"
import { Effect as E, flow, Option as O } from "effect"
import type { NoSuchElementException } from "effect/Cause"
import type { Db } from "../db.js"
import { setting } from "../models/setting.model.js"

export type Setting = "lastest_event_seq" | "lastest_event_tx_didest"

export class SettingRepository {
	constructor(private db: Db) {}

	get(
		key: Setting
	): Result<O.Option<string>, DatabaseException | NoSuchElementException> {
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

	saveLastestCursor({ eventSeq, txDigest }: EventId) {
		return this.set("lastest_event_seq", eventSeq).pipe(
			E.zip(this.set("lastest_event_tx_didest", txDigest), {
				concurrent: true
			}),
			E.asVoid
		)
	}
}
