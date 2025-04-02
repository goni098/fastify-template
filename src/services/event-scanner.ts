import type { EventRepository } from "@database/repositories/event.repository.js"
import type {
	EventCursor,
	SettingRepository
} from "@database/repositories/setting.repository.js"
import type { DatabaseException } from "@exceptions/database.ex.js"
import type { NoRecordUpdatedException } from "@exceptions/no-record-updated.ex.js"
import type { SuiClientException } from "@exceptions/sui-client.ex.js"
import type { PaginatedEvents, SuiEvent } from "@mysten/sui/client"
import { Chunk as C, Duration, Effect as E, pipe } from "effect"
import type { Result } from "#types/result.type.js"
import { Web3Client } from "./web3-client.js"

export class EventScanner {
	constructor(
		private settingRepository: SettingRepository,
		private eventRepository: EventRepository,
		private web3: Web3Client
	) {}

	scan(
		limit: 10,
		cursor: EventCursor
	): Result<
		EventCursor,
		DatabaseException | SuiClientException | NoRecordUpdatedException
	> {
		return pipe(
			this.queryVendingMachineEvents(limit, cursor),
			E.tap(({ data }) => this.saveEvents(data)),
			E.tap(({ data, nextCursor }) =>
				this.settingRepository
					.saveLastestCursor(nextCursor!)
					.pipe(E.when(() => !!nextCursor && data.length > 0))
			),
			E.tap(({ data }) =>
				E.sync(() =>
					console.log(`scanned to ${cursor.txDigest}::${cursor.eventSeq}`)
				).pipe(E.when(() => data.length > 0))
			),
			E.tap(({ hasNextPage }) =>
				E.sync(() => console.log("scanned to latest")).pipe(
					E.when(() => !hasNextPage)
				)
			),
			E.tap(({ hasNextPage }) =>
				E.sleep(Duration.seconds(6)).pipe(E.when(() => !hasNextPage))
			),
			E.flatMap(({ nextCursor }) =>
				pipe(
					nextCursor,
					E.fromNullable,
					E.orElse(() => this.getLastCursor())
				)
			)
		)
	}

	getFirstCursorOrSave(): Result<
		EventCursor,
		DatabaseException | SuiClientException
	> {
		return pipe(
			this.settingRepository.getLastestCursor(),
			E.flatten,
			E.catchTag("NoSuchElementException", () => this.web3.getFirstEventId()),
			E.tap(cursor =>
				this.settingRepository.set("lastest_event_seq", cursor.eventSeq)
			),
			E.tap(cursor =>
				this.settingRepository.set("lastest_event_tx_didest", cursor.txDigest)
			)
		)
	}

	private getLastCursor(): Result<
		EventCursor,
		DatabaseException | SuiClientException
	> {
		return pipe(
			this.settingRepository.getLastestCursor(),
			E.flatten,
			E.catchTag("NoSuchElementException", () =>
				E.dieMessage("Not found cursor from setting table")
			)
		)
	}

	private queryVendingMachineEvents(
		limit: number,
		cursor: EventCursor
	): Result<PaginatedEvents, SuiClientException> {
		return this.web3.queryEvents({
			query: {
				MoveEventModule: {
					module: Web3Client.VENDING_MACHINE_MODULE,
					package: Web3Client.PACKAGE_ID
				}
			},
			order: "ascending",
			cursor,
			limit
		})
	}

	private saveEvents(data: SuiEvent[]): Result<void, DatabaseException> {
		return pipe(
			data,
			C.fromIterable,
			C.map(event =>
				this.eventRepository.save({
					digest: event.id.txDigest,
					type: event.type,
					seq: event.id.eventSeq,
					payload: event.parsedJson ?? {},
					timestamp: event.timestampMs
				})
			),
			E.allWith({ concurrency: "unbounded" })
		)
	}
}
