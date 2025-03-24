import { Duration, Effect as E, Schedule, flow, pipe } from "effect"
import { constTrue, constant } from "effect/Function"
import { EventScanner } from "./console/event-scanner.js"
import { establishConnection } from "./database/db.js"
import { EventRepository } from "./database/repositories/event.repository.js"
import { SettingRepository } from "./database/repositories/setting.repository.js"
import { Web3Client } from "./services/sui.js"

function main() {
	return pipe(
		E.Do,
		E.let("web3", () => new Web3Client()),
		E.let("db", () => establishConnection()),
		E.let("eventRepository", ({ db }) => new EventRepository(db)),
		E.let("settingRepository", ({ db }) => new SettingRepository(db)),
		E.map(
			({ web3, eventRepository, settingRepository }) =>
				new EventScanner(settingRepository, eventRepository, web3)
		),
		E.bindTo("scanner"),
		E.bind("cursor", ({ scanner }) => scanner.getFirstCursorOrSave()),
		E.flatMap(({ scanner, cursor }) =>
			E.iterate(cursor, {
				body: cursor => scanner.scan(10, cursor),
				while: constTrue
			})
		),
		E.tapError(flow(console.error, constant, E.sync)),
		E.retry({
			while: constTrue,
			schedule: Schedule.fixed(Duration.seconds(3))
		}),
		E.runPromise
	)
}

main()
