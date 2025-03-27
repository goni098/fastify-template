import { unwrapResult } from "@utils/result.util"
import type { FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

const plugin: FastifyPluginAsync = async self => {
	self.decorateReply("unwrapResult", unwrapResult)
}

export const unwrapResultPlugin = fastifyPlugin(plugin)
