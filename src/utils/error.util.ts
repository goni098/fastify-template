export const toError = (error: unknown) =>
	error instanceof Error ? error : new Error(JSON.stringify(error, null, 2))

export const retrieveErrorMessage = ({ message }: Error) => message
