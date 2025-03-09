import { PrismaClient } from "@prisma/client";
const plugin = async (self)=>{
    const logFeatureFlag = process.env["LOG_QUERY"];
    const log = [
        "error",
        "warn",
        "info"
    ];
    if (logFeatureFlag) {
        log.push("query");
    }
    const prisma = new PrismaClient({
        log,
        errorFormat: "pretty"
    });
    await prisma.$connect();
    self.decorate("resolveRepository", (Factory)=>new Factory(prisma));
};
export default plugin;

//# sourceMappingURL=_database.plugin.js.map