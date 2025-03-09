import * as z from "zod"

export const UserModel = z.object({
	id: z.bigint().transform(String),
	name: z.string(),
	address: z
		.string()
		.nullish()
		.transform(val => val ?? undefined)
		.optional()
})
