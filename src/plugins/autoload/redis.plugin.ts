import { RedisClient } from "@services/redis-client"
import type { FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

const plugin: FastifyPluginAsync = async self => {
	self.decorate("redis", new RedisClient())
}

export const redisPlugin = fastifyPlugin(plugin)
