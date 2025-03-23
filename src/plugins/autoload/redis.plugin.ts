import { RedisClient } from "@root/shared/redis.js"
import type { FastifyPluginAsync } from "fastify"

const plugin: FastifyPluginAsync = async self => {
	self.decorate("redis", new RedisClient())
}

export default plugin
