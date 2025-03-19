import { establishConnection } from "@root/database/db.js"
import type { RepositoryFactory } from "@root/types/repsoitory-factory.type.js"
import type { FastifyPluginAsync } from "fastify"

const plugin: FastifyPluginAsync = async self => {
	const logFeatureFlag = process.env["LOG_QUERY"]

	const db = establishConnection(logFeatureFlag === "enable")

	self.decorate(
		"resolveRepository",
		<T>(Factory: RepositoryFactory<T>) => new Factory(db)
	)
}

export default plugin
