import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import autoLoad from "@fastify/autoload"
import cors from "@fastify/cors"
import fastifySensible from "@fastify/sensible"
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import { Option as O, pipe } from "effect"
import { isNoSuchElementException } from "effect/Cause"
import fastify, {
	type FastifyError,
	type FastifyReply,
	type FastifyRequest
} from "fastify"
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler
} from "fastify-type-provider-zod"
import { DateTime } from "luxon"
import type { EventRepository } from "./database/repositories/event.repository.js"
import type { RenewTokenRepository } from "./database/repositories/renew-token.repository.js"
import type { SettingRepository } from "./database/repositories/setting.repository.js"
import type { UserRepository } from "./database/repositories/user.repository.js"
import type { User } from "./database/schemas/user.schema.js"
import type { DatabaseException } from "./exceptions/database.ex.js"
import type { JwtSignException } from "./exceptions/jwt-sign.ex.js"
import type { Claims } from "./plugins/auth.plugin.js"
import type { Tokens } from "./plugins/autoload/jwt.plugin.js"
import type { JwtService } from "./services/jwt-service.js"
import type { RedisClient } from "./services/redis-client.js"
import type { Web3Client } from "./services/web3-client.js"
import type { Result } from "./types/result.type.js"
import { canIntoResponse } from "./utils/error.util.js"

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
}

const errorHandler = (
	error: FastifyError,
	request: FastifyRequest,
	reply: FastifyReply
) => {
	if (error.statusCode) return reply.send(error)

	if (isNoSuchElementException(error))
		return reply.internalServerError(error._tag)

	if (canIntoResponse(error)) {
		const response = error.intoResponse()
		reply.statusCode = response.code

		if (response.code === 500) {
			console.error({
				timestamp: DateTime.now().toISO(),
				endpoint: request.url,
				method: request.method,
				originalError: error
			})
		}

		return reply.send(response)
	}

	console.error("untagged error: ", error)

	return reply.internalServerError()
}

const server = () =>
	pipe(import.meta.url, fileURLToPath, dirname, __dirname =>
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
			.register(fastifySwaggerUi, {
				routePrefix: "/docs"
			})
			.register(autoLoad, {
				dir: join(__dirname, "plugins", "autoload"),
				encapsulate: false
			})
			.register(autoLoad, {
				dir: join(__dirname, "routes"),
				matchFilter: path => path.endsWith("handler.js")
			})
	)

function main(): void {
	server().listen({ port: 9098 }, (err, address) =>
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
