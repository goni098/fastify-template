import { defineConfig } from "drizzle-kit"

export default defineConfig({
	dialect: "postgresql",
	schema: "./dist/database/schemas/*.schema.js",
	out: "./src/database/migration",
	casing: "snake_case",
	dbCredentials: {
		url: process.env.DATABASE_URL!
	}
})
