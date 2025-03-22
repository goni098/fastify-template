import { UserRepository } from "@root/database/repositories/user.repository.js"
import { userSelectSchema } from "@root/database/schemas/user.schema.js"
import { authPlg } from "@root/plugins/auth.plugin.js"
import { SECURITY_TAG } from "@root/shared/const.js"
import { unwrapResult } from "@root/utils/result.util.js"
import { pipe } from "effect"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"

const handler: FastifyPluginAsyncZod = async self => {
	self.register(authPlg).get(
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
		({ user }) =>
			pipe(
				UserRepository,
				self.resolveRepository,
				userRepository => userRepository.findById(user.id),
				unwrapResult
			)
	)
}

export default handler
