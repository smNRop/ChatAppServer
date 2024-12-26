import { testMongoService } from '../services/db/db';
import { RelationType, User } from '../schemas/types';
import moment from 'moment';

function createTestUser(number: number): User {
    return {
        email: `TestUser${number}@gmail.com`,
        password: `TestUser${number}`,
        salt: `TestUser${number}`,
        userName: `TestUser${number}`,
        displayName: `TestUser${number}`,
        birthDate: moment().toDate(),
    }
}

describe('Test request with mongoose', () => {
    beforeAll(async () => {
        // const mongod = MongoMemoryServer.create();
        // await testMongoService.init((await mongod).getUri())
        await testMongoService.init()
        await testMongoService.clearDatabase()
    })

    afterEach(async () => {
        await testMongoService.clearDatabase()
    })

    afterAll(async () => {
        await testMongoService.closeDatabase()
    })

    test('user', async () => {
        const user = createTestUser(0)

        const addedUser = await testMongoService.Users.addUser(user)
        expect(addedUser).not.toBeNull()

        let getUser = await testMongoService.Users.getUser(addedUser!._id)
        expect(getUser).not.toBeNull()
        getUser = await testMongoService.Users.getUserByUserName(user.userName)
        expect(getUser).not.toBeNull()
        getUser = await testMongoService.Users.getUserByEmail(user.email)
        expect(getUser).not.toBeNull()

        let userExists = await testMongoService.Users.exists(addedUser!.email, addedUser!.userName)
        expect(userExists).toEqual(true)
        userExists = await testMongoService.Users.exists('wrongEmail@gmail.com', 'wrongUserName')
        expect(userExists).toEqual(false)
    })

    test('relations', async () => {
        let users = await Promise.all([0, 1].map(async number => await testMongoService.Users.addUser(createTestUser(number))))

        let addedRelation = await testMongoService.Users.sendFriendRequest(users[0]!._id, users[1]!._id)

        let gotRelation = await testMongoService.Relations.get(addedRelation!._id)
        expect(gotRelation).toEqual(addedRelation!)

        let acceptFriendRequest = await testMongoService.Users.acceptFriendRequest(users[0]!._id, users[1]!._id)
        expect(acceptFriendRequest).toEqual(true)

        gotRelation = await testMongoService.Relations.get(addedRelation!._id)
        expect(gotRelation).not.toEqual(addedRelation!)
        expect(gotRelation!.type).toEqual(RelationType.FRIENDS)

        let removeFriend = await testMongoService.Users.removeFriend(users[0]!._id, users[1]!._id)
        expect(removeFriend).toEqual(true)

        gotRelation = await testMongoService.Relations.get(addedRelation!._id)
        expect(gotRelation).toBeNull()
    })
})