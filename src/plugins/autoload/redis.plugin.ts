import { RedisClient } from "@services/redis-client.js"
import type { FastifyPluginAsync } from "fastify"

const plugin: FastifyPluginAsync = async self => {
	self.decorate("redis", new RedisClient())
}

export default plugin
