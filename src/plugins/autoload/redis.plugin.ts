import { RedisClient } from "@root/services/redis.js"
import type { FastifyPluginAsync } from "fastify"

const plugin: FastifyPluginAsync = async self => {
	self.decorate("redis", new RedisClient())
}

export default plugin
