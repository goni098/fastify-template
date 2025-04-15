import { JwtSignException } from "@exceptions/jwt-sign.ex.js"
import { JwtVerifyException } from "@exceptions/jwt-verify.ex.js"
import { sign, verify } from "@node-rs/jsonwebtoken"
import type { AuthData, Claims } from "@plugins/auth.plugin.js"
import { Effect as E, pipe } from "effect"
import { DateTime } from "luxon"
import type { Result } from "#types/result.type.js"
import { ACCESS_TOKEN_SECRET } from "../shared/env.js"

export type SignPayload = { id: number; address: string } | { sub: number }

export class JwtService {
	sign(
		payload: AuthData | { sub: number },
		expiresInSecs: number,
		secret = ACCESS_TOKEN_SECRET
	): Result<string, JwtSignException> {
		return pipe(DateTime.now().toSeconds(), iat =>
			E.tryPromise({
				try: () =>
					sign({ data: payload, iat, exp: iat + expiresInSecs }, secret),
				catch: error => new JwtSignException({ error })
			})
		)
	}

	verify<T>(
		token: string,
		secret = ACCESS_TOKEN_SECRET
	): Result<Claims<T>, JwtVerifyException> {
		return E.tryPromise({
			try: () => verify(token, secret) as Promise<Claims<T>>,
			catch: error => new JwtVerifyException({ error })
		})
	}
}
