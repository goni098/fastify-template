import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import autoLoad from "@fastify/autoload"
import cors from "@fastify/cors"
import fastifyJwt from "@fastify/jwt"
import fastifySensible from "@fastify/sensible"
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import fastify from "fastify"
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler
} from "fastify-type-provider-zod"
import { DateTime } from "luxon"
import type { RepositoryFactory } from "./types/repsoitory-factory.type.js"
import type { HttpExceptionResponse } from "./types/result.type.js"

declare module "fastify" {
	interface FastifyInstance {
		resolveRepository: <R>(repo: RepositoryFactory<R>) => R
	}
}

declare module "@fastify/jwt" {
	interface FastifyJWT {
		payload: {
			id: number
		}
	}
}

function main() {
	const __filename = fileURLToPath(import.meta.url)
	const __dirname = dirname(__filename)

	fastify()
		.setValidatorCompiler(validatorCompiler)
		.setSerializerCompiler(serializerCompiler)
		.setErrorHandler((error, request, reply) => {
			if (error.statusCode) return reply.send(error)

			console.error({
				timestamp: DateTime.now().toISO(),
				endpoint: request.url,
				method: request.method,
				message: error.message,
				originalError: error
			})

			// biome-ignore lint/suspicious/noExplicitAny:
			if ((error as any).intoException) {
				// biome-ignore lint/suspicious/noExplicitAny:
				const response = (error as any).intoException() as HttpExceptionResponse
				reply.statusCode = response.code
				return reply.send(response)
			}

			return reply.internalServerError()
		})
		.register(cors)
		.register(fastifySensible)
		.register(fastifyJwt, {
			secret: "ACCESS_TOKEN_SECRET"
		})
		.register(fastifySwagger, {
			openapi: {
				info: {
					title: "FEFT",
					version: "1.0.0"
				},
				servers: []
			},
			transform: jsonSchemaTransform
		})
		.register(fastifySwaggerUi, {
			routePrefix: "/docs"
		})
		.register(autoLoad, {
			dir: join(__dirname, "plugins"),
			matchFilter: path => path.startsWith("/_"),
			encapsulate: false
		})
		.register(autoLoad, {
			dir: join(__dirname, "routes"),
			matchFilter: path => path.endsWith("handler.js")
		})
		.listen({ port: 9098 }, (err, address) => {
			if (err) {
				console.error(err)
				process.exit(1)
			} else {
				console.log(`🦀 server is listening at ${address}`)
			}
		})
}

main()
