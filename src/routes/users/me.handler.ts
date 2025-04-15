import { userSelectSchema } from "@database/schemas/user.schema.js"
import { authPlugin } from "@plugins/auth.plugin.js"
import { SECURITY_TAG } from "@shared/const.js"
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
		({ authData }, reply) =>
			pipe(
				self.repositories.user.findById({ id: authData.id }),
				reply.unwrapResult
			)
	)
}

export default handler
