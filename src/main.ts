import cors from "@fastify/cors"
import fastifySensible from "@fastify/sensible"
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import { dbPlugin } from "@plugins/autoload/database.plugin"
import { redisPlugin } from "@plugins/autoload/redis.plugin"
import { unwrapResultPlugin } from "@plugins/autoload/unwrap-result.plugin"
import { web3Plugin } from "@plugins/autoload/web3.plugin"
import { authRouter, usersRouter } from "@routes/index"
import { Match as M, Option as O, pipe } from "effect"
import { isNoSuchElementException } from "effect/Cause"
import fastify, { type FastifyReply, type FastifyRequest } from "fastify"
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler
} from "fastify-type-provider-zod"
import type { EventRepository } from "./database/repositories/event.repository"
import type { RenewTokenRepository } from "./database/repositories/renew-token.repository"
import type { SettingRepository } from "./database/repositories/setting.repository"
import type { UserRepository } from "./database/repositories/user.repository"
import type { User } from "./database/schemas/user.schema"
import type { DatabaseException } from "./exceptions/database.ex"
import type { JwtSignException } from "./exceptions/jwt-sign.ex"
import type { Claims } from "./plugins/auth.plugin"
import { type Tokens, jwtPlugin } from "./plugins/autoload/jwt.plugin"
import type { JwtService } from "./services/jwt-service"
import type { RedisClient } from "./services/redis-client"
import type { Web3Client } from "./services/web3-client"
import type { Result } from "./types/result.type"
import { canIntoResponse, isFastifyError, traceError } from "./utils/error.util"

const errorHandler = (
	error: unknown,
	request: FastifyRequest,
	reply: FastifyReply
) =>
	M.value(error).pipe(
		M.when(isFastifyError, err => reply.send(err)),
		M.when(isNoSuchElementException, ex => reply.internalServerError(ex._tag)),
		M.when(canIntoResponse, ex =>
			pipe(
				ex.intoResponse(),
				response => traceError(request, response, error),
				response => reply.status(response.code).send(response)
			)
		),
		M.orElse(err => {
			console.error("untagged error: ", err)
			return reply.internalServerError()
		})
	)

function main() {
	fastify()
		.setValidatorCompiler(validatorCompiler)
		.setSerializerCompiler(serializerCompiler)
		.setErrorHandler(errorHandler)
		.register(cors)
		.register(fastifySensible)
		.register(fastifySwagger, {
			openapi: {
				info: { title: "FEFT", version: "1.0.0" },
				components: {
					securitySchemes: {
						bearerAuth: {
							type: "http",
							scheme: "bearer",
							bearerFormat: "JWT"
						}
					}
				}
			},
			transform: jsonSchemaTransform
		})
		.register(fastifySwaggerUi, { routePrefix: "/docs" })
		.register(dbPlugin)
		.register(jwtPlugin)
		.register(redisPlugin)
		.register(unwrapResultPlugin)
		.register(web3Plugin)
		.register(authRouter, { prefix: "auth" })
		.register(usersRouter, { prefix: "users" })
		.listen({ port: 9098 }, (err, address) =>
			pipe(
				err,
				O.fromNullable,
				O.match({
					onNone: () => console.log(`🦀 server is listening at ${address}`),
					onSome: error => {
						console.error(error)
						process.exit(1)
					}
				})
			)
		)
}

main()

declare module "fastify" {
	interface FastifyInstance {
		repositories: {
			user: UserRepository
			renewToken: RenewTokenRepository
			setting: SettingRepository
			event: EventRepository
		}
		sign: (user: User) => Result<Tokens, DatabaseException | JwtSignException>
		jwt: JwtService
		web3: Web3Client
		redis: RedisClient
	}

	interface FastifyRequest {
		claims: Claims
	}

	interface FastifyReply {
		unwrapResult: <A, E>(result: Result<A, E>) => Promise<A>
	}
}
