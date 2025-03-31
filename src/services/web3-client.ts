import { SuiClientException } from "@exceptions/sui-client.ex.js"
import { VerifySigException } from "@exceptions/verify-sig.ex.js"
import {
	type EventId,
	type GetOwnedObjectsParams,
	type PaginatedEvents,
	type PaginatedObjectsResponse,
	type QueryEventsParams,
	SuiClient,
	getFullnodeUrl
} from "@mysten/sui/client"
import { verifyPersonalMessageSignature } from "@mysten/sui/verify"
import { intoError, retrieveErrorMessage } from "@utils/error.util.js"
import { Array as A, Effect as E, flow, pipe } from "effect"
import type { Result } from "#types/result.type.js"

type SuiAddress = string

export class Web3Client {
	static VENDING_MACHINE_MODULE = "vending_machine"
	static PACKAGE_ID =
		"0x0fe25a24dd4a3bbafb8621cd03fee7b1a386189e74c297468c12bbd42c4af604"

	private client: SuiClient

	constructor() {
		this.client = new SuiClient({ url: getFullnodeUrl("testnet") })
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
						message: pipe(error, intoError, retrieveErrorMessage)
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

	getOwnedObjects(
		params: GetOwnedObjectsParams
	): Result<PaginatedObjectsResponse, SuiClientException> {
		return E.tryPromise({
			try: () => this.client.getOwnedObjects(params),
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
