import { userSelectSchema } from "@root/database/models/user.model.js"
import { UserRepository } from "@root/database/repositories/user.repositoty.js"
import { authPlg } from "@root/plugins/auth.plugin.js"
import { SECURITY_TAG } from "@root/shared/const.js"
import { unwrapRlt } from "@root/utils/result.util.js"
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
				unwrapRlt
			)
	)
}

export default handler
