import { JwtService } from "@root/shared/jwt.js"
import type { FastifyPluginAsync } from "fastify"

const plugin: FastifyPluginAsync = async self => {
	self.decorate("jwt", new JwtService())
}

export default plugin
