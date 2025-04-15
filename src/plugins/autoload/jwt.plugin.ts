import type { User } from "@database/schemas/user.schema.js"
import { JwtService } from "@services/jwt-service.js"
import { RENEW_TOKEN_SECRET } from "@shared/env.js"
import { Effect as E, pipe } from "effect"
import type { FastifyPluginAsync } from "fastify"

export interface Tokens {
	accessToken: string
	renewToken: string
}

const plugin: FastifyPluginAsync = async self => {
	self.decorate("jwt", new JwtService())

	self.decorate("sign", (user: User) =>
		pipe(
			{
				accessToken: self.jwt.sign(
					{ id: user.id, address: user.address },
					6 * 3600
				),
				renewToken: self.jwt.sign(
					{ sub: user.id },
					365 * 24 * 3600,
					RENEW_TOKEN_SECRET
				)
			},
			E.allWith({ concurrency: "unbounded" }),
			E.tap(({ renewToken }) =>
				self.repositories.renewToken.save(user.id, renewToken)
			)
		)
	)
}

export default plugin
