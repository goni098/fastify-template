import { Web3Client } from "@services/web3-client"
import type { FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

const plugin: FastifyPluginAsync = async self => {
	self.decorate("web3", new Web3Client())
}

export const web3Plugin = fastifyPlugin(plugin)
