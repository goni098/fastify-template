import { DatabaseError } from "@root/errors/database.error.js"
import type { Result } from "@root/types/result.type.js"
import { eq } from "drizzle-orm"
import { Array as A, Effect as E, pipe } from "effect"
import type { NoSuchElementException } from "effect/Cause"
import type { Db } from "../db.js"
import { type CreateUserInput, type User, user } from "../models/user.model.js"

export class UserRepository {
	constructor(private db: Db) {}

	findById(id: number): Result<User, DatabaseError | NoSuchElementException> {
		return E.tryPromise({
			try: () =>
				this.db.query.user.findFirst({
					where: eq(user.id, id)
				}),
			catch: error => new DatabaseError({ error })
		}).pipe(E.flatMap(E.fromNullable))
	}

	upsert(params: CreateUserInput): Result<User, DatabaseError> {
		return this.findByAddress(params.address).pipe(
			E.catchTag("NoSuchElementException", () => this.create(params))
		)
	}

	private findByAddress(
		address: string
	): Result<User, DatabaseError | NoSuchElementException> {
		return pipe(
			E.tryPromise({
				try: () =>
					this.db.query.user.findFirst({ where: eq(user.address, address) }),
				catch: error => new DatabaseError({ error })
			}),
			E.flatMap(E.fromNullable)
		)
	}

	private create(params: CreateUserInput): Result<User, DatabaseError> {
		return pipe(
			E.tryPromise({
				try: () =>
					this.db.insert(user).values({ address: params.address }).returning(),
				catch: error => new DatabaseError({ error })
			}),
			E.flatMap(A.get(0)),
			E.catchTag("NoSuchElementException", () =>
				E.dieMessage("Get none from returing")
			)
		)
	}
}
