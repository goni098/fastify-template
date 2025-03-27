import type { User } from "@database/schemas/user.schema"
import { JwtService } from "@services/jwt-service"
import { RENEW_TOKEN_SECRET } from "@shared/env"
import { Effect as E, pipe } from "effect"
import type { FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

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
					"12h"
				),
				renewToken: self.jwt.sign({ sub: user.id }, "120d", RENEW_TOKEN_SECRET)
			},
			E.allWith({ concurrency: "unbounded" }),
			E.tap(({ renewToken }) =>
				self.repositories.renewToken.save(user.id, renewToken)
			)
		)
	)
}

export const jwtPlugin = fastifyPlugin(plugin)
