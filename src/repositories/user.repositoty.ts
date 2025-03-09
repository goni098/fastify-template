import type { PrismaClient, User } from "@prisma/client"
import { DatabaseError } from "@root/errors/database.error.js"
import { NoneError } from "@root/errors/none.error.js"
import type { Result } from "@root/types/result.type.js"
import { Effect as E, pipe } from "effect"

export class UserRepository {
	constructor(private prisma: PrismaClient) {}

	findById(id: number): Result<User, DatabaseError | NoneError> {
		return pipe(
			E.tryPromise({
				try: () =>
					this.prisma.user.findUnique({
						where: {
							id
						}
					}),
				catch: error => new DatabaseError({ error })
			}),
			E.flatMap(E.fromNullable),
			E.catchTag("NoSuchElementException", () => E.fail(new NoneError()))
		)
	}

	save(name: string) {
		return pipe(
			E.tryPromise({
				try: () =>
					this.prisma.user.create({
						data: {
							name
						}
					}),
				catch: error => new DatabaseError({ error })
			})
		)
	}
}
