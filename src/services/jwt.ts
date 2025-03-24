import { JwtSignException } from "@root/exceptions/jwt-sign.ex.js"
import { JwtVerifyException } from "@root/exceptions/jwt-verify.ex.js"
import type { Result } from "@root/types/result.type.js"
import { Boolean as B, Effect as E, pipe } from "effect"
import { constant } from "effect/Function"
import jwt from "jsonwebtoken"
import { ACCESS_TOKEN_SECRET } from "../shared/env.js"

export type SignPayload = { id: number; address: string } | { sub: number }

export class JwtService {
	sign(
		payload: string | Buffer | object,
		expiresIn: jwt.SignOptions["expiresIn"],
		secret = ACCESS_TOKEN_SECRET
	): Result<string, JwtSignException> {
		return E.async(resume =>
			jwt.sign(payload, secret, { expiresIn }, (error, token) =>
				pipe(
					!error,
					B.match({
						onTrue: E.succeed(token!).pipe(resume, constant),
						onFalse: E.fail(new JwtSignException({ error })).pipe(
							resume,
							constant
						)
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
					!error,
					B.match({
						onTrue: E.succeed(payload as T).pipe(resume, constant),
						onFalse: E.fail(new JwtVerifyException({ error })).pipe(
							resume,
							constant
						)
					})
				)
			)
		)
	}
}
