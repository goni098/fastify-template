import {} from "@mysten/sui/utils"
import { RedisException } from "@root/exceptions/redis.ex.js"
import { suiAddress } from "@root/shared/parser.js"
import { userSignMsgKey } from "@root/utils/redis.util.js"
import { unwrapResult } from "@root/utils/result.util.js"
import { Effect as E, pipe } from "effect"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import randomstr from "randomstring"
import { z } from "zod"

const handler: FastifyPluginAsyncZod = async self => {
	self.get(
		"/sign-message",
		{
			schema: {
				querystring: z.object({
					address: suiAddress()
				}),
				tags: ["auth"],
				response: {
					200: z.object({
						message: z.string()
					})
				}
			}
		},
		({ query }) =>
			pipe(
				randomstr.generate(),
				E.succeed,
				E.tap(msg =>
					E.tryPromise({
						try: () => self.redis.set(userSignMsgKey(query.address), msg),
						catch: error => new RedisException({ error })
					})
				),
				E.map(message => ({ message })),
				unwrapResult
			)
	)
}

export default handler
