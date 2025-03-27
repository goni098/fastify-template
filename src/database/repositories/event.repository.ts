import { type CreateEventInput, eventTable } from "../schemas/event.schema"
import { BaseRepository } from "./_base.repository"

export class EventRepository extends BaseRepository(eventTable) {
	save(data: CreateEventInput) {
		return this.insertOnConflictDoNothing(data, [
			eventTable.digest,
			eventTable.seq
		])
	}
}
