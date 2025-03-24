import {} from "@mysten/sui/utils"
import { HttpException } from "@root/exceptions/http.ex.js"
import { RENEW_TOKEN_SECRET } from "@root/shared/env.js"
import { unwrapResult } from "@root/utils/result.util.js"
import { Effect as E, pipe } from "effect"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"

const handler: FastifyPluginAsyncZod = async self => {
	self.post(
		"/renew",
		{
			schema: {
				body: z.object({
					token: z.string()
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
				E.Do,
				E.bind("claims", () =>
					self.jwt.verify<{ sub: number }>(body.token, RENEW_TOKEN_SECRET)
				),
				E.bind("storedToken", ({ claims }) =>
					self.repositories.renewToken.findTokenByUserId(claims.sub)
				),
				E.tap(({ storedToken }) =>
					HttpException.Unauthorized("Unmatch token").pipe(
						E.when(() => storedToken !== body.token)
					)
				),
				E.bind("user", ({ claims }) =>
					self.repositories.user.findById(claims.sub)
				),
				E.bind("tokens", ({ user }) => self.sign(user)),
				E.tap(({ tokens, claims }) =>
					self.repositories.renewToken.save(claims.sub, tokens.renewToken)
				),
				E.map(({ tokens }) => tokens),
				unwrapResult
			)
	)
}

export default handler
