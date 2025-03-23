import { Web3Client } from "@root/shared/sui.js"
import type { FastifyPluginAsync } from "fastify"

const plugin: FastifyPluginAsync = async self => {
	self.decorate("web3", new Web3Client())
}

export default plugin
