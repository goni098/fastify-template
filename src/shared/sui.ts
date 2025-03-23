import {
	type EventId,
	type PaginatedEvents,
	type QueryEventsParams,
	SuiClient,
	getFullnodeUrl
} from "@mysten/sui/client"
import { verifyPersonalMessageSignature } from "@mysten/sui/verify"
import { SuiClientException } from "@root/exceptions/sui-client.ex.js"
import { VerifySigException } from "@root/exceptions/verify-sig.ex.js"
import type { Result } from "@root/types/result.type.js"
import { retrieveErrorMessage, toError } from "@root/utils/error.util.js"
import { Array as A, Effect as E, flow, pipe } from "effect"

type SuiAddress = string

export class Web3Client {
	static VENDING_MACHINE_MODULE = "vending_machine"
	static PACKAGE_ID =
		"0x0fe25a24dd4a3bbafb8621cd03fee7b1a386189e74c297468c12bbd42c4af604"

	private client: SuiClient

	constructor() {
		this.client = new SuiClient({
			url: getFullnodeUrl("testnet")
		})
	}

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
		return E.tryPromise({
			try: () => this.client.queryEvents(params),
			catch: error => new SuiClientException({ error })
		})
	}

	getFirstEventId(): Result<EventId, SuiClientException> {
		return pipe(
			this.queryEvents({
				limit: 1,
				order: "ascending",
				query: {
					MoveEventModule: {
						module: Web3Client.VENDING_MACHINE_MODULE,
						package: Web3Client.PACKAGE_ID
					}
				}
			}),
			E.flatMap(flow(res => res.data, A.fromIterable, A.get(0))),
			E.map(({ id }) => id),
			E.catchTag("NoSuchElementException", () =>
				E.dieMessage("package has not emitted any events")
			)
		)
	}
}
