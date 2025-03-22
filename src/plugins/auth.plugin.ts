import { HttpException } from "@root/exceptions/http.ex.js"
import { retrieveErrorMessage, toError } from "@root/utils/error.util.js"
import { unwrapResult } from "@root/utils/result.util.js"
import { Effect as E, flow } from "effect"
import type { FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

export type Claims = {
	id: number
	address: string
	iat: number
	exp: number
}

const plugin: FastifyPluginAsync = async self => {
	self.addHook("onRequest", async (request, _reply) =>
		E.tryPromise({
			try: () => request.jwtVerify(),
			catch: flow(toError, retrieveErrorMessage, HttpException.unauthorized)
		}).pipe(unwrapResult)
	)
}

export const authPlg = fastifyPlugin(plugin)
