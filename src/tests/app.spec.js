"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/services/db/db");
//import { Resolvers } from '../schemas/resolvers';
const types_1 = require("../src/schemas/types");
const moment_1 = __importDefault(require("moment"));
describe('Test request with mongoose', () => {
    beforeAll(async () => {
        // const mongod = MongoMemoryServer.create();
        // await MongoService.instance.init((await mongod).getUri())
        await db_1.MongoService.instance.init('DiscordTest');
        await db_1.MongoService.instance.clearDatabase();
    });
    afterEach(async () => {
        await db_1.MongoService.instance.clearDatabase();
    });
    afterAll(async () => {
        await db_1.MongoService.instance.closeDatabase();
    });
    test('user', async () => {
        const user = {
            email: 'TestUser@gmail.com',
            password: 'TestUser',
            salt: 'TestUser',
            userName: 'TestUser',
            displayName: 'TestUser',
            birthDate: (0, moment_1.default)().toDate(),
        };
        const addedUser = await db_1.MongoService.instance.Users.addUser(user);
        expect(addedUser).not.toBeNull();
        let getUser = await db_1.MongoService.instance.Users.getUser(addedUser._id);
        expect(getUser).not.toBeNull();
        getUser = await db_1.MongoService.instance.Users.getUserByUserName(user.userName);
        expect(getUser).not.toBeNull();
        getUser = await db_1.MongoService.instance.Users.getUserByEmail(user.email);
        expect(getUser).not.toBeNull();
        let userExists = await db_1.MongoService.instance.Users.exists(addedUser.email, addedUser.userName);
        expect(userExists).toEqual(true);
        userExists = await db_1.MongoService.instance.Users.exists('wrongEmail@gmail.com', 'wrongUserName');
        expect(userExists).toEqual(false);
    });
    test('relations', async () => {
        let users = await Promise.all([0, 1].map(async (number) => await db_1.MongoService.instance.Users.addUser({
            email: `TestUser${number}@gmail.com`,
            password: `TestUser${number}`,
            salt: `TestUser${number}`,
            userName: `TestUser${number}`,
            displayName: `TestUser${number}`,
            birthDate: (0, moment_1.default)().toDate(),
        })));
        let addedRelation = await db_1.MongoService.instance.Users.sendFriendRequest(users[0]._id, users[1]._id);
        let gotRelation = await db_1.MongoService.instance.Relations.get(addedRelation._id);
        expect(gotRelation).toEqual(addedRelation);
        let acceptFriendRequest = await db_1.MongoService.instance.Users.acceptFriendRequest(users[0]._id, users[1]._id);
        expect(acceptFriendRequest).toEqual(true);
        gotRelation = await db_1.MongoService.instance.Relations.get(addedRelation._id);
        expect(gotRelation).not.toEqual(addedRelation);
        expect(gotRelation.type).toEqual(types_1.RelationType.FRIENDS);
        let removeFriend = await db_1.MongoService.instance.Users.removeFriend(users[0]._id, users[1]._id);
        expect(removeFriend).toEqual(true);
        gotRelation = await db_1.MongoService.instance.Relations.get(addedRelation._id);
        expect(gotRelation).toBeNull();
    });
});
