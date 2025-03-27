import type { FastifyPluginAsync } from "fastify"

export const authRouter: FastifyPluginAsync = async self => {
	self
		.register(require("./auth/get-sign-message.handler"))
		.register(require("./auth/renew-token.handler"))
		.register(require("./auth/verify-personal-msg.handler"))
}

export const usersRouter: FastifyPluginAsync = async self => {
	self
		.register(require("./users/get-owned-nfts.handler"))
		.register(require("./users/me.handler"))
}
