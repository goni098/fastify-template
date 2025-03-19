import { defineConfig } from "drizzle-kit"

export default defineConfig({
	dialect: "postgresql",
	schema: "./dist/database/models/*.model.js",
	out: "./src/database/schema",
	casing: "snake_case",
	dbCredentials: {
		url: process.env.DATABASE_URL!
	}
})
