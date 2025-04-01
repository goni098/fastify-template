import { z } from "zod"

const schema = z.object({
	DATABASE_URL: z.string().min(1),
	REDIS_URL: z.string().min(1),
	ACCESS_TOKEN_SECRET: z.string().min(1),
	RENEW_TOKEN_SECRET: z.string().min(1)
})

export const {
	DATABASE_URL,
	ACCESS_TOKEN_SECRET,
	RENEW_TOKEN_SECRET,
	REDIS_URL
} = schema.parse(process.env)
