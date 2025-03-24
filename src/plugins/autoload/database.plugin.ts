import { type Db, establishConnection } from "@root/database/db.js"
import { EventRepository } from "@root/database/repositories/event.repository.js"
import { RenewTokenRepository } from "@root/database/repositories/renew-token.repository.js"
import { SettingRepository } from "@root/database/repositories/setting.repository.js"
import { UserRepository } from "@root/database/repositories/user.repository.js"
import { pipe } from "effect"
import type { FastifyPluginAsync } from "fastify"

interface Repositories {
	user: UserRepository
	renewToken: RenewTokenRepository
	setting: SettingRepository
	event: EventRepository
}

const intitRepositories = (db: Db): Repositories => ({
	user: new UserRepository(db),
	setting: new SettingRepository(db),
	renewToken: new RenewTokenRepository(db),
	event: new EventRepository(db)
})

const plugin: FastifyPluginAsync = async self => {
	self.decorate(
		"repositories",
		pipe(
			process.env["LOG_QUERY"] === "enable",
			establishConnection,
			intitRepositories
		)
	)
}

export default plugin
