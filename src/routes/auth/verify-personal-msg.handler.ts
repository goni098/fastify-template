import { UserRepository } from "@root/database/repositories/user.repositoty.js"
import { JwtSignError } from "@root/errors/jwt-sign.error.js"
import { unwrap } from "@root/utils/result.util.js"
import { Effect, pipe } from "effect"
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
				Effect.Do,
				Effect.let("userRepo", () => self.resolveRepository(UserRepository)),
				Effect.bind("address", () =>
					self.web3.verifyPersonalMsg(body.message, body.signature)
				),
				Effect.flatMap(({ address, userRepo }) =>
					userRepo.saveIfNotExist({ address })
				),
				Effect.flatMap(user =>
					Effect.tryPromise({
						try: () => reply.jwtSign({ id: user.id, address: user.address }),
						catch: error => new JwtSignError({ error })
					})
				),
				Effect.map(accessToken => ({
					accessToken
				})),
				unwrap
			)
	)
}

export default handler
