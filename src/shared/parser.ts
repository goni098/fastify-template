import { isValidSuiAddress } from "@mysten/sui/utils"
import { z } from "zod"

export const positiveInt = () =>
	z
		.union([z.string(), z.number()])
		.transform(Number)
		.pipe(z.number().int().min(1))

export const numberic = () =>
	z.union([z.string(), z.number()]).transform(Number)

export const ignoreEmptyStr = (trim = true) =>
	z.string().transform(val => {
		const str = trim ? val.trim() : val
		return str.length > 0 ? str : undefined
	})

export const suiAddress = () =>
	z.string().refine(isValidSuiAddress, "invalid sui address")

export const optionalStr = () =>
	z
		.string()
		.transform(s => (s.trim() === "" ? undefined : s.trim()))
		.optional()
