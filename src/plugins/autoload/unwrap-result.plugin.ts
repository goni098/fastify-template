import { unwrapResult } from "@utils/result.util.js"
import type { FastifyPluginAsync } from "fastify"

const plugin: FastifyPluginAsync = async self => {
	self.decorateReply("unwrapResult", unwrapResult)
}

export default plugin
