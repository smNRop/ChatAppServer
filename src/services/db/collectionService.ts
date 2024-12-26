import { BSON, Collection, Db } from 'mongodb'

export default class CollectionService<T extends BSON.Document> {
    collection: Collection<T>
    
    constructor(database: Db, collectionName: string) {
        this.collection = database.collection<T>(collectionName)
    }
}