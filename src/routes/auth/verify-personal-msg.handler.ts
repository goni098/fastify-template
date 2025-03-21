import { UserRepository } from "@root/database/repositories/user.repository.js"
import { HttpException } from "@root/exceptions/http.ex.js"
import { JwtSignException } from "@root/exceptions/jwt-sign.ex.js"
import { RedisException } from "@root/exceptions/redis.ex.js"
import { userSignMsgKey } from "@root/utils/redis.util.js"
import { unwrapResult } from "@root/utils/result.util.js"
import { Effect as E, pipe } from "effect"
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
						accessToken: z.string()
					})
				}
			}
		},
		({ body }, reply) =>
			pipe(
				E.Do,
				E.let("userRepo", () => self.resolveRepository(UserRepository)),
				E.bind("address", () =>
					self.web3.verifyPersonalMsg(body.message, body.signature)
				),
				E.tap(({ address }) =>
					E.tryPromise({
						try: () => self.redis.get(userSignMsgKey(address)),
						catch: error => new RedisException({ error })
					}).pipe(
						E.flatMap(E.fromNullable),
						E.tap(message =>
							HttpException.Unauthorized("unmatch message").pipe(
								E.when(() => body.message !== message)
							)
						),
						E.catchTag("NoSuchElementException", () =>
							HttpException.Unauthorized("message was not created")
						)
					)
				),
				E.flatMap(({ address, userRepo }) => userRepo.upsert({ address })),
				E.flatMap(user =>
					E.tryPromise({
						try: () => reply.jwtSign({ id: user.id, address: user.address }),
						catch: error => new JwtSignException({ error })
					})
				),
				E.map(accessToken => ({
					accessToken
				})),
				unwrapResult
			)
	)
}

export default handler
