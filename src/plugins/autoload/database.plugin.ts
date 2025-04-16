import { type Db, establishConnection } from "@database/config.js"
import { EventRepository } from "@database/repositories/event.repository.js"
import { RenewTokenRepository } from "@database/repositories/renew-token.repository.js"
import { SettingRepository } from "@database/repositories/setting.repository.js"
import { UserRepository } from "@database/repositories/user.repository.js"
import { pipe } from "effect"
import type { FastifyPluginAsync } from "fastify"

export type Repositories = ReturnType<typeof intitRepositories>

const intitRepositories = (db: Db) => ({
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
