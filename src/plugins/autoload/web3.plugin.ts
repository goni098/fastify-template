import { SuiClient, getFullnodeUrl } from "@mysten/sui/client"
import { Web3Client } from "@root/shared/sui.js"
import type { FastifyPluginAsync } from "fastify"

const plugin: FastifyPluginAsync = async self => {
	const client = new SuiClient({ url: getFullnodeUrl("testnet") })
	const web3 = new Web3Client(client)

	self.decorate("web3", web3)
}

export default plugin
