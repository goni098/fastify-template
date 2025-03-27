const { build } = require("esbuild")

function main() {
	build({
		platform: "node",
		target: "node20",
		format: "cjs",
		bundle: true,
		minify: true,
		sourcemap: true,
		entryPoints: ["./src/main.ts", "./src/console.ts"],
		outdir: "build",
		external: ["@fastify/swagger-ui"]
	}).then(() => console.log("finished"))
}

main()
