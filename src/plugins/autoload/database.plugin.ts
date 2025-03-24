import { establishConnection } from "@root/database/db.js"
import type { RepositoryFactory } from "@root/types/repsoitory-factory.type.js"
import { pipe } from "effect"
import type { FastifyPluginAsync } from "fastify"

const plugin: FastifyPluginAsync = async self => {
	self.decorate(
		"resolveRepository",
		pipe(
			process.env["LOG_QUERY"] === "enable",
			establishConnection,
			db =>
				<T>(Factory: RepositoryFactory<T>) =>
					new Factory(db)
		)
	)
}

export default plugin
