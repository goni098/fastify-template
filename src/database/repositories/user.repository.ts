import { DatabaseException } from "@root/exceptions/database.ex.js"
import type { Result } from "@root/types/result.type.js"
import { eq } from "drizzle-orm"
import { Array as A, Effect as E, pipe } from "effect"
import type { NoSuchElementException } from "effect/Cause"
import type { Db } from "../db.js"
import {
	type CreateUserInput,
	type User,
	userTable
} from "../schemas/user.schema.js"

export class UserRepository {
	constructor(private db: Db) {}

	findById(
		id: number
	): Result<User, DatabaseException | NoSuchElementException> {
		return E.tryPromise({
			try: () =>
				this.db.query.user.findFirst({
					where: eq(userTable.id, id)
				}),
			catch: error => new DatabaseException({ error })
		}).pipe(E.flatMap(E.fromNullable))
	}

	upsert(params: CreateUserInput): Result<User, DatabaseException> {
		return this.findByAddress(params.address).pipe(
			E.catchTag("NoSuchElementException", () => this.create(params))
		)
	}

	private findByAddress(
		address: string
	): Result<User, DatabaseException | NoSuchElementException> {
		return pipe(
			E.tryPromise({
				try: () =>
					this.db.query.user.findFirst({
						where: eq(userTable.address, address)
					}),
				catch: error => new DatabaseException({ error })
			}),
			E.flatMap(E.fromNullable)
		)
	}

	private create(params: CreateUserInput): Result<User, DatabaseException> {
		return pipe(
			E.tryPromise({
				try: () =>
					this.db
						.insert(userTable)
						.values({ address: params.address })
						.returning(),
				catch: error => new DatabaseException({ error })
			}),
			E.flatMap(A.get(0)),
			E.catchTag("NoSuchElementException", () =>
				E.dieMessage("Get none from returing")
			)
		)
	}
}
