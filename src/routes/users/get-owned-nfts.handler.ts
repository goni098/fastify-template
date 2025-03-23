import { authPlg } from "@root/plugins/auth.plugin.js"
import { SECURITY_TAG } from "@root/shared/const.js"
import { numberic, optionalStr } from "@root/shared/parser.js"
import { Web3Client } from "@root/shared/sui.js"
import { unwrapResult } from "@root/utils/result.util.js"
import { pipe } from "effect"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"

const handler: FastifyPluginAsyncZod = async self => {
	self.register(authPlg).get(
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
		({ claims, query }) =>
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
				unwrapResult
			)
	)
}

export default handler
