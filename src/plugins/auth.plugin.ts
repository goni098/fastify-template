import type { FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

export type Claims = {
	id: number
	address: string
	iat: number
	exp: number
}

const plugin: FastifyPluginAsync = async self => {
	self.addHook("onRequest", async (request, reply) => {
		try {
			await request.jwtVerify()
		} catch {
			throw reply.unauthorized()
		}
	})
}

export const authPlg = fastifyPlugin(plugin)
