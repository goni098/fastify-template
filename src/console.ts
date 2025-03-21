import {
	EventId,
	type PaginatedEvents,
	SuiClient,
	getFullnodeUrl
} from "@mysten/sui/client"
import { Duration, Effect as E, Effect, flow, Option as O, pipe } from "effect"
import { Chunk as C, Array as A } from "effect"
import { establishConnection } from "./database/db.js"
import { EventRepository } from "./database/repositories/event.repository.js"
import { SettingRepository } from "./database/repositories/setting.repository.js"
import type { DatabaseException } from "./exceptions/database.ex.js"
import { Web3Client } from "./shared/sui.js"
import type { Result } from "./types/result.type.js"
import { SuiClientException } from "./exceptions/sui-client.ex.js"
import { NoSuchElementException } from "effect/Cause"

type Cursor = EventId

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
		E.bind("cursor", ({ settingRepository }) =>
			settingRepository.get("lastest_event_seq").pipe(
				E.zip(settingRepository.get("lastest_event_tx_didest")),
				E.map(([eventSeq, txDigest]) => ({ eventSeq, txDigest }))
			)
		),
		E.flatMap(({ client, eventRepository, settingRepository }) =>
			E.iterate(O.none<Cursor>(), {
				body: cursor =>
					handleEvents(client, cursor, eventRepository, settingRepository),
				while: () => true
			})
		),
		Effect.runPromise
	)
}

main()

// function handleEvents(
// 	client: Web3Client,
// 	cursor: Cursor,
// 	eventRepository: EventRepository,
// 	settingRepository: SettingRepository
// ): Result<O.Option<Cursor>, DatabaseException> {
// 	return pipe(
// 		cursor,

// 		C.fromIterable,
// 		C.map(event =>
// 			eventRepository.save({
// 				digest: event.id.txDigest,
// 				type: event.type,
// 				seq: event.id.eventSeq,
// 				payload: event.parsedJson!
// 			})
// 		),
// 		E.all,
// 		E.tap(() => {
// 			console.log(events.nextCursor)
// 			return settingRepository
// 				.saveLastestCursor(events.nextCursor!)
// 				.pipe(E.when(() => !!events.nextCursor && events.data.length > 0))
// 		}),
// 		// E.tap(() => E.sleep(Duration.seconds(10))),
// 		E.as(events.nextCursor),
// 		E.map(O.fromNullable)
// 	)
// }

function getDefaultCursor(
	client: Web3Client
): Result<Cursor, SuiClientException | NoSuchElementException> {
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
