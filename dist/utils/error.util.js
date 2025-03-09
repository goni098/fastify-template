export const toError = (error)=>error instanceof Error ? error : new Error(JSON.stringify(error, null, 2));
export const retrieveErrorMessage = ({ message })=>message;

//# sourceMappingURL=error.util.js.map