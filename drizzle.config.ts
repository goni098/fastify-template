import { defineConfig } from "drizzle-kit"

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/database/schemas/*.schema.ts",
	out: "./src/database/migration",
	casing: "snake_case",
	dbCredentials: {
		url: process.env.DATABASE_URL!
	}
})
