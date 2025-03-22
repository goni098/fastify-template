import { SuiClient, getFullnodeUrl } from "@mysten/sui/client"
import { Duration, Effect as E, Effect, Option as O, flow, pipe } from "effect"
import { Array as A, Boolean as B, Chunk as C } from "effect"
import type { NoSuchElementException } from "effect/Cause"
import { establishConnection } from "./database/db.js"
import { EventRepository } from "./database/repositories/event.repository.js"
import {
	type EventCursor,
	SettingRepository
} from "./database/repositories/setting.repository.js"
import type { DatabaseException } from "./exceptions/database.ex.js"
import type { SuiClientException } from "./exceptions/sui-client.ex.js"
import { Web3Client } from "./shared/sui.js"
import type { Result } from "./types/result.type.js"

const MODULE = "vending_machine"

const PACKAGE =
	"0x0fe25a24dd4a3bbafb8621cd03fee7b1a386189e74c297468c12bbd42c4af604"

function main() {
	return pipe(
		new SuiClient({
			url: getFullnodeUrl("testnet")
		}),
		suiClient => new Web3Client(suiClient),
		E.succeed,
		E.bindTo("client"),
		E.let("db", () => establishConnection()),
		E.let("eventRepository", ({ db }) => new EventRepository(db)),
		E.let("settingRepository", ({ db }) => new SettingRepository(db)),
		E.bind("cursor", ({ settingRepository, client }) =>
			settingRepository.getLastestCursor().pipe(
				E.flatten,
				E.catchTag("NoSuchElementException", () => getDefaultCursor(client)),
				E.tap(cursor =>
					settingRepository.set("lastest_event_seq", cursor.eventSeq)
				),
				E.tap(cursor =>
					settingRepository.set("lastest_event_tx_didest", cursor.txDigest)
				)
			)
		),
		E.flatMap(({ client, eventRepository, settingRepository, cursor }) =>
			E.iterate(O.some(cursor), {
				body: cursor =>
					scan(client, cursor, eventRepository, settingRepository),
				while: () => true
			})
		),
		Effect.runPromise
	)
}

main()

function scan(
	client: Web3Client,
	cursor: O.Option<EventCursor>,
	eventRepository: EventRepository,
	settingRepository: SettingRepository
): Result<O.Option<EventCursor>, DatabaseException | SuiClientException> {
	return pipe(
		cursor,
		O.match({
			onNone: flow(
				O.none,
				E.succeed,
				E.tap(() => console.log("scanned to latest")),
				E.tap(() => E.sleep(Duration.seconds(10)))
			),
			onSome: cursor =>
				handleEvents(client, cursor, eventRepository, settingRepository)
		})
	)
}

function handleEvents(
	client: Web3Client,
	cursor: EventCursor,
	eventRepository: EventRepository,
	settingRepository: SettingRepository
) {
	return pipe(
		client.queryEvents({
			query: {
				MoveEventModule: { module: MODULE, package: PACKAGE }
			},
			order: "ascending",
			cursor,
			limit: 10
		}),
		E.tap(({ data }) =>
			pipe(
				data,
				C.fromIterable,
				C.map(event =>
					eventRepository.save({
						digest: event.id.txDigest,
						type: event.type,
						seq: event.id.eventSeq,
						payload: event.parsedJson!,
						timestamp: event.timestampMs
					})
				),
				E.all
			)
		),
		E.tap(() =>
			console.log(`scanned to ${cursor.txDigest}::${cursor.eventSeq}`)
		),
		E.tap(({ data, nextCursor }) =>
			settingRepository
				.saveLastestCursor(nextCursor!)
				.pipe(E.when(() => !!nextCursor && data.length > 0))
		),
		E.map(({ hasNextPage, nextCursor }) =>
			pipe(
				hasNextPage,
				B.match({
					onTrue: () => pipe(nextCursor, O.fromNullable),
					onFalse: O.none
				})
			)
		)
	)
}

function getDefaultCursor(
	client: Web3Client
): Result<EventCursor, SuiClientException | NoSuchElementException> {
	return pipe(
		client.queryEvents({
			limit: 1,
			order: "ascending",
			query: {
				MoveEventModule: { module: MODULE, package: PACKAGE }
			}
		}),
		E.flatMap(flow(res => res.data, A.fromIterable, A.get(0))),
		E.map(({ id }) => id)
	)
}
