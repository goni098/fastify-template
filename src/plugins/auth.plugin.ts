import { HttpException } from "@root/exceptions/http.ex.js"
import type { Result } from "@root/types/result.type.js"
import { unwrapResult } from "@root/utils/result.util.js"
import { Array as A, Effect as E, pipe } from "effect"
import type { FastifyPluginAsync, FastifyRequest } from "fastify"
import fastifyPlugin from "fastify-plugin"

export type Claims = {
	id: number
	address: string
	iat: number
	exp: number
}

const plugin: FastifyPluginAsync = async self => {
	self.addHook("onRequest", async (request, _reply) =>
		pipe(
			lookupToken(request),
			E.flatMap(token => self.jwt.verify<Claims>(token)),
			E.tap(claims =>
				E.sync(() => {
					request.claims = claims
				})
			),
			unwrapResult
		)
	)
}

const lookupToken = (request: FastifyRequest): Result<string, HttpException> =>
	pipe(
		request.headers.authorization?.split("Bearer ") ?? [],
		A.fromIterable,
		A.get(1),
		E.flatMap(E.fromNullable),
		E.mapError(() => HttpException.unauthorized("Missing Bearer token"))
	)

export const authPlg = fastifyPlugin(plugin)
