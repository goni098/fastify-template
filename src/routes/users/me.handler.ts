import { userSelectSchema } from "@database/schemas/user.schema"
import { authPlugin } from "@plugins/auth.plugin"
import { SECURITY_TAG } from "@shared/const"
import { pipe } from "effect"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"

const handler: FastifyPluginAsyncZod = async self => {
	self.register(authPlugin).get(
		"/me",
		{
			schema: {
				security: SECURITY_TAG,
				tags: ["users"],
				response: {
					200: userSelectSchema
				}
			}
		},
		({ claims }, reply) =>
			pipe(self.repositories.user.findById(claims.id), reply.unwrapResult)
	)
}

export default handler
