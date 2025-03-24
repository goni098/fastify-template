import { HttpException } from "@root/exceptions/http.ex.js"
import type { RedisException } from "@root/exceptions/redis.ex.js"
import type { Result } from "@root/types/result.type.js"
import { userSignMsgKey } from "@root/utils/redis.util.js"
import { unwrapResult } from "@root/utils/result.util.js"
import { Effect as E, pipe } from "effect"
import type { FastifyInstance } from "fastify"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"

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
		({ body }) =>
			pipe(
				self.web3.verifyPersonalMsg(body.message, body.signature),
				E.tap(address => validateMessage(self, address, body.message)),
				E.flatMap(address => self.repositories.user.upsert({ address })),
				E.flatMap(user => self.sign(user)),
				unwrapResult
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
