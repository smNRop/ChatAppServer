import { Relations } from './relations'
import { MongoClient } from 'mongodb'
import { Sessions } from './sessions'
import { Users } from './users'

class MongoService {
    protected client!: MongoClient
    protected dbName: string
    protected url: string

    public Users!: Users
    public Sessions!: Sessions
    public Relations!: Relations

    public constructor(dbName: string = 'Discord', url: string = 'mongodb://localhost:27017') {
        this.dbName = dbName
        this.url = url
    }

    public async init(): Promise<MongoService> {
        this.client = new MongoClient(this.url)
        await this.client.connect()

        const database = this.client.db(this.dbName)
        
        this.Users = new Users(database)
        this.Sessions = new Sessions(database)
        this.Relations = new Relations(database)

        return this
    }
}

class TestMongoService extends MongoService {
    public constructor() {
        super('DiscordTest')
    }

    public async closeDatabase(): Promise<void> {
        await this.client.db(this.dbName).dropDatabase()
        await this.client.close()
    }

    public async clearDatabase(): Promise<void> {
        const collections = await this.client.db(this.dbName).collections()
        for (const collection of collections) {
            await collection.deleteMany({});
         }
    }
}

export const testMongoService = new TestMongoService()
export const mongoService = new MongoService()