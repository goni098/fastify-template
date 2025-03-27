import { DatabaseException } from "@exceptions/database.ex"
import { NoRecordUpdatedException } from "@exceptions/no-record-updated.ex"
import {
	type InferInsertModel,
	type InferSelectModel,
	type SQL,
	eq
} from "drizzle-orm"
import type {
	IndexColumn,
	PgTransactionConfig,
	SelectedFields
} from "drizzle-orm/pg-core"
import type {
	JoinNullability,
	SelectResult
} from "drizzle-orm/query-builders/select.types"
import type { createUpdateSchema } from "drizzle-zod"
import { Array as A, Boolean as B, Effect as E, pipe } from "effect"
import type { NoSuchElementException } from "effect/Cause"
import type { QueryResult } from "pg"
import type { z } from "zod"
import type { Result } from "#types/result.type"
import type { Db } from "../config"
import type { BaseTable } from "../schemas/_base.schema"

type Model<T extends BaseTable> = InferSelectModel<T>

type CreateInput<T extends BaseTable> = InferInsertModel<T>

type UpdateInput<T extends BaseTable> = z.infer<
	ReturnType<typeof createUpdateSchema<T>>
>

type Select<S> = SelectResult<S, "single", Record<string, JoinNullability>>

type TxParams<P> = (
	tx: Parameters<Parameters<Db["transaction"]>[0]>[0]
) => Promise<P>

type FindOption<S> = {
	select?: S
	filter?: SQL
	sort?: SQL
	limit?: number
	offset?: number
}

// SelectedFields
export const BaseRepository = <T extends BaseTable>(table: T) => {
	type QueryReturns<S> = S extends undefined ? Model<T> : Select<S>

	return class Base {
		constructor(protected db: Db) {}

		protected find<S extends SelectedFields | undefined>(
			opts: FindOption<S> = {}
		): Result<QueryReturns<S>[], DatabaseException> {
			return pipe(
				this.db.select(opts.select as SelectedFields).from(table as BaseTable),
				E.succeed,
				E.map(query => (opts.filter ? query.where(opts.filter) : query)),
				E.map(query => (opts.sort ? query.orderBy(opts.sort) : query)),
				E.map(query => (opts.limit ? query.limit(opts.limit) : query)),
				E.map(query => (opts.offset ? query.offset(opts.offset) : query)),
				E.flatMap(query =>
					E.tryPromise({
						// biome-ignore lint/suspicious/noExplicitAny:>
						try: () => query.execute() as any,
						catch: error => new DatabaseException({ error })
					})
				)
			)
		}

		protected findFirstBy<S extends SelectedFields | undefined = undefined>(
			filter: SQL,
			select?: S
		): Result<QueryReturns<S>, DatabaseException | NoSuchElementException> {
			return pipe(this.find({ filter, select }), E.flatMap(A.get(0)))
		}

		findById<S extends SelectedFields | undefined = undefined>(
			id: number,
			select?: S
		): Result<QueryReturns<S>, DatabaseException | NoSuchElementException> {
			return this.findFirstBy(eq(table.id, id), select)
		}

		$countBy(filter: SQL): Result<number, DatabaseException> {
			return E.tryPromise({
				catch: error => new DatabaseException({ error }),
				try: () => this.db.$count(table, filter)
			})
		}

		protected $transaction<P>(tx: TxParams<P>, config?: PgTransactionConfig) {
			return E.tryPromise({
				try: () => this.db.transaction(tx, config),
				catch: error => new DatabaseException({ error })
			})
		}

		protected insertOnConflictDoUpdate(
			params: CreateInput<T>,
			conflict?: IndexColumn | IndexColumn[]
		): Result<void, DatabaseException> {
			return E.tryPromise({
				try: () =>
					this.db
						.insert(table)
						.values(params)
						.onConflictDoUpdate({
							// biome-ignore lint/suspicious/noExplicitAny:>
							set: params as any,
							target: conflict ?? table.id
						}),
				catch: error => new DatabaseException({ error })
			}).pipe(E.asVoid)
		}

		protected insertOnConflictDoNothing(
			params: CreateInput<T>,
			conflict?: IndexColumn | IndexColumn[]
		): Result<void, DatabaseException> {
			return E.tryPromise({
				try: () =>
					this.db
						// biome-ignore lint/suspicious/noExplicitAny:>
						.insert(table as any)
						.values(params)
						.onConflictDoNothing({
							target: conflict
						}),
				catch: error => new DatabaseException({ error })
			}).pipe(E.asVoid)
		}

		protected insertWithReturning(
			params: CreateInput<T>
		): Result<Model<T>, DatabaseException> {
			return pipe(
				E.tryPromise({
					try: () =>
						this.db.insert(table).values(params).returning() as Promise<
							Model<T>[]
						>,
					catch: error => new DatabaseException({ error })
				}),
				E.flatMap(A.get(0)),
				E.catchTag("NoSuchElementException", () =>
					E.dieMessage("Get none from returing")
				)
			)
		}

		protected upsert(
			filter: SQL,
			params: CreateInput<T>
		): Result<Model<T>, DatabaseException> {
			return pipe(
				this.findFirstBy(filter),
				E.catchTag("NoSuchElementException", () =>
					this.insertWithReturning(params)
				)
			)
		}

		protected update(
			filter: SQL,
			params: UpdateInput<T>
		): Result<QueryResult, NoRecordUpdatedException | DatabaseException> {
			return pipe(
				E.tryPromise({
					try: () => this.db.update(table).set(params).where(filter),
					catch: error => new DatabaseException({ error })
				}),
				E.flatMap(veirfyUpdateResult)
			)
		}

		protected updateById(
			id: number,
			params: UpdateInput<T>
		): Result<void, NoRecordUpdatedException | DatabaseException> {
			return this.update(eq(table.id, id), params)
		}
	}
}

const veirfyUpdateResult = (
	result: QueryResult
): Result<QueryResult, NoRecordUpdatedException> =>
	pipe(
		Number(result.rowCount) > 0,
		B.match({
			onTrue: () => E.succeed(result),
			onFalse: () => E.fail(new NoRecordUpdatedException())
		})
	)
