import { DatabaseException } from "@exceptions/database.ex.js"
import { NoRecordUpdatedException } from "@exceptions/no-record-updated.ex.js"
import {
	type InferInsertModel,
	type InferSelectModel,
	type SQL,
	count,
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
import type { Result } from "#types/result.type.js"
import type { Db } from "../config.js"
import type { BaseTable } from "../schemas/_base.schema.js"

type Model<T extends BaseTable> = InferSelectModel<T>

type InsertData<T extends BaseTable> = InferInsertModel<T>

type UpdateData<T extends BaseTable> = z.infer<
	ReturnType<typeof createUpdateSchema<T>>
>

type SelectReturns<Selection> = SelectResult<
	Selection,
	"single",
	Record<string, JoinNullability>
>

type QueryReturns<
	Table extends BaseTable,
	Selection
> = Selection extends undefined ? Model<Table> : SelectReturns<Selection>

type TxParams<P> = (
	tx: Parameters<Parameters<Db["transaction"]>[0]>[0]
) => Promise<P>

interface FindOption<S> {
	select?: S
	filter?: SQL
	sort?: SQL
	limit?: number
	offset?: number
}

interface FindByIdParam<S> {
	id: number
	select?: S
}

interface FindFirstParam<S> {
	filter: SQL
	select?: S
}

interface InsertOnConflictParam<T extends BaseTable> {
	data: InsertData<T>
	conflict?: IndexColumn | IndexColumn[]
}

interface UpsertParam<T extends BaseTable> {
	data: InsertData<T>
	where: SQL
}

interface UpdateParam<T extends BaseTable> {
	data: UpdateData<T>
	where: SQL
}

interface AggregateParam<T> {
	target: SQL<T>
	filter?: SQL
}

export const BaseRepository = <T extends BaseTable>(table: T) => {
	return class Base {
		constructor(protected db: Db) {}

		findById<S extends SelectedFields | undefined = undefined>({
			id,
			select
		}: FindByIdParam<S>): Result<
			QueryReturns<T, S>,
			DatabaseException | NoSuchElementException
		> {
			return this.findFirst({ filter: eq(table.id, id), select })
		}

		protected $count(filter?: SQL): Result<number, DatabaseException> {
			return pipe(
				this.$aggregate({ filter, target: count(table.id) }),
				E.catchTag("NoSuchElementException", () => E.succeed(0))
			)
		}

		protected $aggregate<Agg>({
			filter,
			target
		}: AggregateParam<Agg>): Result<
			Agg,
			DatabaseException | NoSuchElementException
		> {
			return pipe(
				this.find({ filter, select: { val: target } }),
				E.flatMap(A.get(0)),
				E.map(record => record.val)
			)
		}

		protected find<S extends SelectedFields | undefined>(
			opts: FindOption<S> = {}
		): Result<QueryReturns<T, S>[], DatabaseException> {
			return pipe(
				this.db.select(opts.select as SelectedFields).from(table as BaseTable),
				E.succeed,
				E.map(query => (opts.filter ? query.where(opts.filter) : query)),
				E.map(query => (opts.sort ? query.orderBy(opts.sort) : query)),
				E.map(query => (opts.limit ? query.limit(opts.limit) : query)),
				E.map(query => (opts.offset ? query.offset(opts.offset) : query)),
				E.flatMap(query =>
					E.tryPromise({
						try: () =>
							query.execute() as unknown as Promise<QueryReturns<T, S>[]>,
						catch: error => new DatabaseException({ error })
					})
				)
			)
		}

		protected findFirst<S extends SelectedFields | undefined = undefined>({
			filter,
			select
		}: FindFirstParam<S>): Result<
			QueryReturns<T, S>,
			DatabaseException | NoSuchElementException
		> {
			return pipe(
				E.tryPromise({
					try: () =>
						this.db
							.select(select as SelectedFields)
							.from(table as BaseTable)
							.where(filter) as unknown as Promise<QueryReturns<T, S>[]>,
					catch: error => new DatabaseException({ error })
				}),
				E.flatMap(A.get(0))
			)
		}

		protected $transaction<P>(
			tx: TxParams<P>,
			config?: PgTransactionConfig
		): Result<P, DatabaseException> {
			return E.tryPromise({
				try: () => this.db.transaction(tx, config),
				catch: error => new DatabaseException({ error })
			})
		}

		protected insert(params: InsertData<T>): Result<void, DatabaseException> {
			return E.tryPromise({
				try: () => this.db.insert(table).values(params),
				catch: error => new DatabaseException({ error })
			}).pipe(E.asVoid)
		}

		protected insertOnConflictDoUpdate({
			data,
			conflict
		}: InsertOnConflictParam<T>): Result<void, DatabaseException> {
			return E.tryPromise({
				try: () =>
					this.db
						.insert(table)
						.values(data)
						.onConflictDoUpdate({
							set: data as unknown as UpdateData<T>,
							target: conflict ?? table.id
						}),
				catch: error => new DatabaseException({ error })
			}).pipe(E.asVoid)
		}

		protected insertOnConflictDoNothing({
			data,
			conflict
		}: InsertOnConflictParam<T>): Result<void, DatabaseException> {
			return E.tryPromise({
				try: () =>
					this.db
						.insert(table as BaseTable)
						.values(data)
						.onConflictDoNothing({
							target: conflict
						}),
				catch: error => new DatabaseException({ error })
			}).pipe(E.asVoid)
		}

		protected insertWithReturning(
			data: InsertData<T>
		): Result<Model<T>, DatabaseException> {
			return pipe(
				E.tryPromise({
					try: () =>
						this.db.insert(table).values(data).returning() as Promise<
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

		protected upsert({
			data,
			where
		}: UpsertParam<T>): Result<Model<T>, DatabaseException> {
			return pipe(
				this.findFirst({ filter: where }),
				E.catchTag("NoSuchElementException", () =>
					this.insertWithReturning(data)
				)
			)
		}

		protected update({
			data,
			where
		}: UpdateParam<T>): Result<
			QueryResult,
			NoRecordUpdatedException | DatabaseException
		> {
			return pipe(
				E.tryPromise({
					try: () => this.db.update(table).set(data).where(where),
					catch: error => new DatabaseException({ error })
				}),
				E.flatMap(veirfyUpdateResult)
			)
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
