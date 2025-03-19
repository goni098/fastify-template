import { DatabaseError } from "@root/errors/database.error.js"
import { NoneError } from "@root/errors/none.error.js"
import type { Result } from "@root/types/result.type.js"
import { eq } from "drizzle-orm"
import { Array as A, Effect as E, pipe } from "effect"
import type { Db } from "../db.js"
import { type CreateUserInput, type User, user } from "../models/user.model.js"

export class UserRepository {
	constructor(private db: Db) {}

	findById(id: number): Result<User, DatabaseError | NoneError> {
		return pipe(
			E.tryPromise({
				try: () =>
					this.db.query.user.findFirst({
						where: eq(user.id, id)
					}),
				catch: error => new DatabaseError({ error })
			}),
			E.flatMap(E.fromNullable),
			E.catchTag("NoSuchElementException", () => E.fail(new NoneError()))
		)
	}

	save(params: CreateUserInput): Result<User, DatabaseError | NoneError> {
		return pipe(
			E.tryPromise({
				try: () => this.db.insert(user).values(params).returning(),
				catch: error => new DatabaseError({ error })
			}),
			E.flatMap(A.get(0)),
			E.catchTag("NoSuchElementException", () => E.fail(new NoneError()))
		)
	}
}
