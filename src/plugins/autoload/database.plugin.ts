import { type Db, establishConnection } from "@database/config"
import { EventRepository } from "@database/repositories/event.repository"
import { RenewTokenRepository } from "@database/repositories/renew-token.repository"
import { SettingRepository } from "@database/repositories/setting.repository"
import { UserRepository } from "@database/repositories/user.repository"
import { pipe } from "effect"
import type { FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

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

export const dbPlugin = fastifyPlugin(plugin)
