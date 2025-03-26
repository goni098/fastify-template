import { type CreateEventInput, eventTable } from "../schemas/event.schema.js"
import { BaseRepository } from "./_base.repository.js"

export class EventRepository extends BaseRepository(eventTable) {
	save(data: CreateEventInput) {
		return this.insertOnConflictDoNothing(data, [
			eventTable.digest,
			eventTable.seq
		])
	}
}
