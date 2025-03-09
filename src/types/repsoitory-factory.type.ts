import type { PrismaClient } from "@prisma/client/extension"

export type RepositoryFactory<R> = new (prisma: PrismaClient) => R
