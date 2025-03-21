import type {
	PaginatedEvents,
	QueryEventsParams,
	SuiClient
} from "@mysten/sui/client"
import { verifyPersonalMessageSignature } from "@mysten/sui/verify"
import { SuiClientException } from "@root/exceptions/sui-client.ex.js"
import { VerifySigException } from "@root/exceptions/verify-sig.ex.js"
import type { Result } from "@root/types/result.type.js"
import { retrieveErrorMessage, toError } from "@root/utils/error.util.js"
import { Effect as E, pipe } from "effect"

type SuiAddress = string

export class Web3Client {
	constructor(private client: SuiClient) {}

	verifyPersonalMsg(
		msg: string,
		signature: string
	): Result<SuiAddress, VerifySigException> {
		return pipe(
			E.tryPromise({
				try: () =>
					verifyPersonalMessageSignature(
						new TextEncoder().encode(msg),
						signature
					),
				catch: error =>
					new VerifySigException({
						message: pipe(error, toError, retrieveErrorMessage)
					})
			}),
			E.map(pubkey => pubkey.toSuiAddress())
		)
	}

	queryEvents(
		params: QueryEventsParams
	): Result<PaginatedEvents, SuiClientException> {
		return pipe(
			E.tryPromise({
				try: () => this.client.queryEvents(params),
				catch: error => new SuiClientException({ error })
			})
		)
	}
}
