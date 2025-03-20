import { z } from "zod"

const schema = z.object({
	DATABASE_URL: z.string().min(1),
	ACCESS_TOKEN_SECRET: z.string().min(1)
})

export const { DATABASE_URL, ACCESS_TOKEN_SECRET } = schema.parse(process.env)
