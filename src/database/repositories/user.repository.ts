import { eq } from "drizzle-orm"
import { type CreateUserInput, userTable } from "../schemas/user.schema.js"
import { BaseRepository } from "./_base.repository.js"

export class UserRepository extends BaseRepository(userTable) {
	createIfNotExist(data: CreateUserInput) {
		return this.upsert({ data, where: eq(userTable.address, data.address) })
	}
}
