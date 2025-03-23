import { JwtSignException } from "@root/exceptions/jwt-sign.ex.js"
import { JwtVerifyException } from "@root/exceptions/jwt-verify.ex.js"
import type { Result } from "@root/types/result.type.js"
import { Effect as E, Option, pipe } from "effect"
import jwt from "jsonwebtoken"
import { ACCESS_TOKEN_SECRET } from "./env.js"

export type SignPayload = { id: number; address: string } | { sub: number }

export class JwtService {
	sign(
		payload: string | Buffer | object,
		secret = ACCESS_TOKEN_SECRET
	): Result<string, JwtSignException> {
		return E.async(resume =>
			jwt.sign(payload, secret, (error, token) =>
				pipe(
					error,
					Option.fromNullable,
					Option.match({
						onNone: () => E.succeed(token!).pipe(resume),
						onSome: error =>
							E.fail(new JwtSignException({ error })).pipe(resume)
					})
				)
			)
		)
	}

	verify<T>(
		token: string,
		secret = ACCESS_TOKEN_SECRET
	): Result<T, JwtVerifyException> {
		return E.async(resume =>
			jwt.verify(token, secret, (error, payload) =>
				pipe(
					error,
					Option.fromNullable,
					Option.match({
						onNone: () => resume(E.succeed(payload as T)),
						onSome: error =>
							E.fail(new JwtVerifyException({ error })).pipe(resume)
					})
				)
			)
		)
	}
}
