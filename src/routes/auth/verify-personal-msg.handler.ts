import { UserRepository } from "@root/database/repositories/user.repositoty.js"
import { JwtSignError } from "@root/errors/jwt-sign.error.js"
import { unwrapRlt } from "@root/utils/result.util.js"
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
				E.flatMap(({ address, userRepo }) => userRepo.upsert({ address })),
				E.flatMap(user =>
					E.tryPromise({
						try: () => reply.jwtSign({ id: user.id, address: user.address }),
						catch: error => new JwtSignError({ error })
					})
				),
				E.map(accessToken => ({
					accessToken
				})),
				unwrapRlt
			)
	)
}

export default handler
