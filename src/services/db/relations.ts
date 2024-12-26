import { Relation, RelationType } from '../../schemas/types'
import { Db, ObjectId, WithId } from 'mongodb'
import CollectionService from "./collectionService"

export class Relations extends CollectionService<Relation> {
    public constructor(database: Db) {
        super(database, 'Relations')
    }

    async add(relation: Relation): Promise<WithId<Relation>> {
        if(relation.users[0].equals(relation.users[1])) {
            throw new Error('A relation cannot be created between the same user.')
        }

        const relationExists = await this.relationExistsByUserIds(relation.users)

        if(relationExists) {
            throw new Error('The relation with those two users exists.')
        }

        const result = await this.collection.insertOne(relation)

        if(!result.acknowledged) {
            throw new Error('New relation wasn\'t added to database.')
        }

        return {
            _id: result.insertedId,
            ...relation
        }
    }

    async remove(_id: ObjectId): Promise<boolean> {
        const result = await this.collection.deleteOne({_id})
        return result.acknowledged
    }

    async removeByUserIds(users: [ObjectId, ObjectId]): Promise<boolean> {
        const result = await this.collection.deleteOne({
            users: {$all: users}
        })
        return result.acknowledged
    }
    
    async updateType(_id: ObjectId, type: RelationType): Promise<boolean> {
        const result = await this.collection.updateOne(
            {_id},
            {type}
        )
        return result.acknowledged
    }

    async updateRelationTypeByUserIds(users: [ObjectId, ObjectId], type: RelationType): Promise<boolean> {
        if(users[0].equals(users[1])) {
            throw new Error('A relation cannot be updated between the same user.')
        }

        const result = await this.collection.updateOne(
            {users: {$all: users}},
            {$set: {
                type
            }}
        )
        return result.acknowledged
    }

    async get(_id: ObjectId): Promise<WithId<Relation> | null> {
        const result = await this.collection.findOne({_id})
        return result
    }

    async relationExistsByUserIds(users: [ObjectId, ObjectId]): Promise<boolean> {
        const result = await this.collection.findOne({users: {$all: users}})
        return result != null 
    }

    async getRelatedUserIdsByType(userId: ObjectId, type: RelationType): Promise<ObjectId[]> {
        try {
            return await this.collection.find(
                {users: userId, type}
            ).map(relation => relation.users.find(id => id != userId)!).toArray()
        } catch(e) {
            throw new Error('Internal error.')
        }
    }
}