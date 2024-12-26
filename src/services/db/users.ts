import { PublicUser, Relation, RelationType, User, Session, PrivateUser, LoginInput, RegistrationInput } from '../../schemas/types'
import { Db, ObjectId, WithId } from 'mongodb'
import CollectionService from './collectionService'
import { createHmac, randomBytes } from 'node:crypto'
import { mongoService } from './db'

export class Users extends CollectionService<User> {
    public constructor(database: Db) {
        super(database, 'Users')
    }
    
    async addUser(user: User): Promise<WithId<User>> {
        const newUser = await this.collection.insertOne(user)

        if(!newUser.acknowledged) {
            throw new Error('User was not added.')
        }

        return {
            ...user,
            _id: newUser.insertedId
        }
    }

    async removeUser(user: User): Promise<boolean> {
        const newUser = await this.collection.deleteOne(user)
        return newUser.acknowledged
    }

    async exists(email: string, userName: string): Promise<boolean> {
        return await this.collection.countDocuments({
            $or: [{email}, {userName}]
        }) > 0
    }

    async getUser(_id: ObjectId): Promise<WithId<User> | null> {
        const user = await this.collection.findOne({_id})
        return user
    }

    async getUserByUserName(userName: string): Promise<WithId<User>> {
        const user = await this.collection.findOne({userName})

        if(user == null) {
            throw new Error('User does not exist!')
        }

        return user
    }

    async getUserByEmail(email: string): Promise<WithId<User>> {
        const user = await this.collection.findOne({email})

        if(user == null) {
            throw new Error('User does not exist!')
        }

        return user
    }

    async sendFriendRequest(from: ObjectId, to: ObjectId): Promise<WithId<Relation>> {
        if (from.equals(to)) {
            throw new Error('You cannot send a friend request to yourself.')
        }

        const result = await mongoService.Relations.add({
            users: [from, to],
            type: RelationType.REQUESTED
        })

        return result
    }

    async register(input: RegistrationInput): Promise<WithId<Session>> {
        const salt = randomBytes(128).toString('base64')
        const hmac = createHmac('sha512', salt)
        hmac.update(input.password)
        const hashedPassword = hmac.digest('hex')

        const user: User = {
            ...input,
            password: hashedPassword,
            salt: salt,
        }

        if(await this.exists(user.email, user.userName)) {
            throw new Error('User exists!')
        }

        const addedUser = await this.addUser(user)

        return await mongoService.Sessions.createSession(addedUser._id)
    }

    async acceptFriendRequest(from: ObjectId, to: ObjectId): Promise<boolean> {
        if(from.equals(to)) {
            throw new Error('You cannot accept a friend request to yourself.')
        }

        const result = await mongoService.Relations.updateRelationTypeByUserIds([from, to], RelationType.FRIENDS)
        return result
    }

    async declineFriendRequest(from: ObjectId, to: ObjectId): Promise<boolean> {
        if(from.equals(to)) {
            throw new Error('You cannot decline a friend request to yourself.')
        }

        return await this.removeRelation([from, to])
    }

    async removeFriend(from: ObjectId, to: ObjectId): Promise<boolean> {
        if(from.equals(to)) {
            throw new Error('You cannot remove yourself as a friend.')
        }

        return await this.removeRelation([from, to])
    }

    private async removeRelation(users: [ObjectId, ObjectId]): Promise<boolean> {
        return await mongoService.Relations.removeByUserIds(users)
    }

    async getUsers(usersIds: ObjectId[]): Promise<WithId<User>[]> {
        return await this.collection.find({_id: usersIds}).toArray()
    }

    async getUsersFriends(userId: ObjectId): Promise<WithId<PrivateUser>[]> {
        const ids = await mongoService.Relations.getRelatedUserIdsByType(userId, RelationType.FRIENDS)
        return await this.getUsers(ids)
    }

    async getUsersFriendRequests(userId: ObjectId): Promise<WithId<PublicUser>[]> {
        const ids = await mongoService.Relations.getRelatedUserIdsByType(userId, RelationType.REQUESTED)
        return await this.getUsers(ids)
    }

    async login(input: LoginInput): Promise<WithId<Session>> {
        const user = await mongoService.Users.getUserByEmail(input.email)

        const hmac = createHmac('sha512', user.salt)
        hmac.update(input.password)
        const hashedPassword = hmac.digest('hex')

        if(hashedPassword != user.password) {
            throw new Error("Wrong credentials!")
        }

        return await mongoService.Sessions.createSession(user._id)
    }

    // async blockUser(from: ObjectId, to: ObjectId): Promise<boolean> {
    //     const result = await mongoService.Relations.changeTypeByUsersId(from, to, RelationType.BLOCKED)

    //     return result
    // }
}