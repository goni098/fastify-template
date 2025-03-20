import type { SuiClient } from "@mysten/sui/client"
import { verifyPersonalMessageSignature } from "@mysten/sui/verify"
import { VerifySigError } from "@root/errors/verify-sig.error.js"
import type { Result } from "@root/types/result.type.js"
import { retrieveErrorMessage, toError } from "@root/utils/error.util.js"
import { Effect, pipe } from "effect"

type SuiAddress = string

export class Web3Client {
	constructor(private client: SuiClient) {}

	verifyPersonalMsg(
		msg: string,
		signature: string
	): Result<SuiAddress, VerifySigError> {
		return pipe(
			Effect.tryPromise({
				try: () =>
					verifyPersonalMessageSignature(
						new TextEncoder().encode(msg),
						signature
					),
				catch: error =>
					new VerifySigError({
						message: pipe(error, toError, retrieveErrorMessage)
					})
			}),
			Effect.map(pubkey => pubkey.toSuiAddress())
		)
	}
}
