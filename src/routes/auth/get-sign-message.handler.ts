import { suiAddress } from "@shared/parser"
import { userSignMsgKey } from "@utils/redis.util"
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
		({ query }, reply) =>
			pipe(
				randomstr.generate(),
				E.succeed,
				E.tap(msg => self.redis.set(userSignMsgKey(query.address), msg, 300)),
				E.map(message => ({ message })),
				reply.unwrapResult
			)
	)
}

export default handler
