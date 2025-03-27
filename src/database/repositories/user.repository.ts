import { eq } from "drizzle-orm"
import { type CreateUserInput, userTable } from "../schemas/user.schema"
import { BaseRepository } from "./_base.repository"

export class UserRepository extends BaseRepository(userTable) {
	createIfNotExist(data: CreateUserInput) {
		return this.upsert(eq(userTable.address, data.address), data)
	}
}
