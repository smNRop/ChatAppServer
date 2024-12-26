import { Db, ObjectId, WithId } from 'mongodb'
import { Session } from '../../schemas/types'
import CollectionService from './collectionService'
import moment from 'moment'

export class Sessions extends CollectionService<Session> {
    constructor(database: Db) {
        super(database, 'Sessions');

        this.collection.createIndex({'createdAt': 1}, {expireAfterSeconds: 3600})
    }

    public async createSession(userId: ObjectId): Promise<WithId<Session>> {
        const data: Session =  {
            userId,
            createdAt: moment().toDate()
        }

        const createdSession = await this.collection.insertOne(data)

        if(!createdSession.acknowledged) {
            throw new Error('Session was not created.')
        }

        return {
            ...data,
            _id: createdSession.insertedId
        }
    }

    public async getSession(userId: ObjectId): Promise<WithId<Session> | null> {
        const result = await this.collection.findOne({
            userId
        })

        return result
    }

    public async removeSession(_id: ObjectId): Promise<void> {
        const result = await this.collection.deleteOne()

        if(!result.acknowledged) {
            throw new Error('Session does not exits.')
        }
    }

    public async checkSessionById(_id: ObjectId): Promise<WithId<Session> | null> {
        const result = await this.collection.findOne({
            _id
        })
        
        return result
    }

    public async checkSessionByTokenString(token: string): Promise<WithId<Session> | null> {
        const result = await this.collection.findOne({
            _id: new ObjectId(token)
        })

        return result
    }
}