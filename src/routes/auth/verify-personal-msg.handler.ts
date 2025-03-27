import { HttpException } from "@exceptions/http.ex"
import type { RedisException } from "@exceptions/redis.ex"
import { userSignMsgKey } from "@utils/redis.util"
import { Effect as E, pipe } from "effect"
import type { FastifyInstance } from "fastify"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import type { Result } from "#types/result.type"

const handler: FastifyPluginAsyncZod = async self => {
	self.post(
		"/verify-personal-msg",
		{
			schema: {
				body: z.object({
					message: z.string(),
					signature: z.string()
				}),
				tags: ["auth"],
				response: {
					200: z.object({
						accessToken: z.string(),
						renewToken: z.string()
					})
				}
			}
		},
		({ body }, reply) =>
			pipe(
				self.web3.verifyPersonalMsg(body.message, body.signature),
				E.tap(address => validateMessage(self, address, body.message)),
				E.flatMap(address =>
					self.repositories.user.createIfNotExist({
						address
					})
				),
				E.flatMap(user => self.sign(user)),
				reply.unwrapResult
			)
	)
}

const validateMessage = (
	self: FastifyInstance,
	address: string,
	message: string
): Result<void, RedisException | HttpException> =>
	self.redis.get(userSignMsgKey(address)).pipe(
		E.flatMap(E.fromNullable),
		E.tap(storedMessage =>
			HttpException.Unauthorized("unmatch message").pipe(
				E.when(() => message !== storedMessage)
			)
		),
		E.catchTag("NoSuchElementException", () =>
			HttpException.Unauthorized("message was not created or expired")
		),
		E.asVoid
	)

export default handler
