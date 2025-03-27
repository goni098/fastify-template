import { HttpException } from "@exceptions/http.ex"
import { Array as A, Effect as E, pipe } from "effect"
import type { FastifyPluginAsync, FastifyRequest } from "fastify"
import fastifyPlugin from "fastify-plugin"
import type { Result } from "#types/result.type"

export type Claims = {
	id: number
	address: string
	iat: number
	exp: number
}

const plugin: FastifyPluginAsync = async self => {
	self.addHook("onRequest", async (request, reply) =>
		pipe(
			lookupToken(request),
			E.flatMap(token => self.jwt.verify<Claims>(token)),
			E.tap(claims =>
				E.sync(() => {
					request.claims = claims
				})
			),
			reply.unwrapResult
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

export const authPlugin = fastifyPlugin(plugin)
