import { authPlugin } from "@plugins/auth.plugin.js"
import { Web3Client } from "@services/web3-client.js"
import { SECURITY_TAG } from "@shared/const.js"
import { numberic, optionalStr } from "@shared/parser.js"
import { pipe } from "effect"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"

const handler: FastifyPluginAsyncZod = async self => {
	self.register(authPlugin).get(
		"/nfts",
		{
			schema: {
				security: SECURITY_TAG,
				tags: ["users"],
				querystring: z.object({
					cursor: optionalStr(),
					limit: numberic()
				})
				// response: {
				// 	200: z.object({
				// 		id: z.string(),
				// 		name: z.string(),
				// 		description: z.string(),
				// 		url: z.string()
				// 	})
				// }
			}
		},
		({ claims, query }, reply) =>
			pipe(
				self.web3.getOwnedObject({
					options: {
						showContent: true,
						showType: true
					},
					filter: {
						StructType: `${Web3Client.PACKAGE_ID}::${Web3Client.VENDING_MACHINE_MODULE}::Nft`
					},
					owner: claims.address,
					limit: query.limit,
					cursor: query.cursor
				}),
				reply.unwrapResult
			)
	)
}

export default handler
