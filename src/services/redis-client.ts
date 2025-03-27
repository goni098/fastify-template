import { RedisException } from "@exceptions/redis.ex"
import { Effect as E } from "effect"
import { Redis } from "ioredis"

export class RedisClient {
	private client: Redis

	constructor() {
		this.client = new Redis()
	}

	get(key: string) {
		return E.tryPromise({
			try: () => this.client.get(key),
			catch: error => new RedisException({ error })
		})
	}

	set(key: string, value: string | Buffer | number, ttlInSec: number) {
		return E.tryPromise({
			try: () => this.client.set(key, value, "EX", ttlInSec),
			catch: error => new RedisException({ error })
		})
	}
}
