import type { Prisma } from "@prisma/client"
import { PrismaClient } from "@prisma/client"
import type { RepositoryFactory } from "@root/types/repsoitory-factory.type.js"
import type { FastifyPluginAsync } from "fastify"

const plugin: FastifyPluginAsync = async self => {
	const logFeatureFlag = process.env["LOG_QUERY"]
	const log: Prisma.LogLevel[] = ["error", "warn", "info"]
	if (logFeatureFlag) {
		log.push("query")
	}

	const prisma = new PrismaClient<Prisma.PrismaClientOptions, "query">({
		log,
		errorFormat: "pretty"
	})

	await prisma.$connect()

	self.decorate(
		"resolveRepository",
		<T>(Factory: RepositoryFactory<T>) => new Factory(prisma)
	)
}

export default plugin
