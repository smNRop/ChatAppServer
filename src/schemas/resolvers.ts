import { Context, ID, LoginInput, PrivateUser, PublicUser, RegistrationInput, User } from './types';
import { createHmac, randomBytes } from 'node:crypto'
import { mongoService } from '../services/db/db';
import { GraphQLError } from 'graphql';
import { ObjectId, WithId } from 'mongodb'
import moment from 'moment';
import joi from 'joi';
import CustomError from '../CustomError';

export default class Resolvers {
    public getQuery() {
        return {
            me: this.withAuthorizedUser(async(_: any, user: WithId<User>, context: Context): Promise<User> => user),
            login: async (args: { loginInput: LoginInput }, context: Context): Promise<string> => {
                const schema = joi.object<LoginInput>({
                    email: joi.string().email().required(),
                    password: joi.string().required()
                })

                const validated = await schema.validateAsync(args.loginInput)

                const result = await mongoService.Users.login(validated)
                return result._id.toString()
            },
            logout: this.withAuthorizedUser(async (_: any, user: WithId<User>, context: Context): Promise<boolean> => {
                try {
                    await mongoService.Sessions.removeSession(new ObjectId(context.token!))
                    return true
                } catch(e) {
                    throw new GraphQLError(this.errorHandling(e))
                }
            }),
            friendRequests: this.withAuthorizedUser(async (args: any, user: WithId<User>, context: Context): Promise<PublicUser[]> => {
                try {
                    return await mongoService.Users.getUsersFriendRequests(user._id)
                } catch(e) {
                    throw new GraphQLError(this.errorHandling(e))
                }
            }),
            friends: this.withAuthorizedUser(async (args: any, user: WithId<User>, context: Context): Promise<PrivateUser[]> => { 
                try {
                    return await mongoService.Users.getUsersFriends(user._id)
                } catch(e) {
                    throw new GraphQLError(this.errorHandling(e))
                }
            })
        }
    }

    public getMutation() {
        return {
            registration: async (args: { registrationInput: RegistrationInput }, context: Context): Promise<string> => {
                const schema = joi.object<RegistrationInput>({
                    email: joi.string().email().required(),
                    password: joi.string().pattern(new RegExp(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/)).required(),
                    displayName: joi.string().pattern(new RegExp(/^[A-Za-z\d _.-]{1,12}$/)).required(),
                    userName: joi.string().pattern(new RegExp(/^[A-Za-z\d_.-]{1,12}$/)).required(), 
                    birthDate: joi.date().min(moment().subtract(100, 'years').toDate()).max(moment().subtract(18, 'years').toDate()).required()
                })

                const validate = async () => {
                    try {
                        return await schema.validateAsync(args.registrationInput)
                    }catch(e) {
                        throw new GraphQLError(this.errorHandling(e))
                    }
                }
                const validated = await validate()
                
                try {
                    const createdSession = await mongoService.Users.register(validated)
                    return createdSession._id.toString()
                } catch(e) {
                    throw new GraphQLError(this.errorHandling(e))
                }
            },
            sendFriendRequest: this.withAuthorizedUser(async (args: { id: ID }, user: WithId<User>, context: Context): Promise<boolean> => {
                try {
                    await mongoService.Users.sendFriendRequest(user._id, new ObjectId(args.id))
                } catch(e) {
                    throw new GraphQLError(this.errorHandling(e))
                }

                return true
            }),
            acceptFriendRequest: this.withAuthorizedUser(async (args: { id: ID }, user: WithId<User>, context: Context): Promise<boolean> => {
                try {
                    await mongoService.Users.acceptFriendRequest(user._id, new ObjectId(args.id))
                } catch(e) {
                    throw new GraphQLError(this.errorHandling(e))
                }

                return true
            }),
            declineFriendRequest: this.withAuthorizedUser(async (args: { id: ID }, user: WithId<User>, context: Context): Promise<boolean> => {
                try {
                    await mongoService.Users.declineFriendRequest(user._id, new ObjectId(args.id))
                } catch(e) {
                    throw new GraphQLError(this.errorHandling(e))
                }

                return true
            }),
            removeFriend: this.withAuthorizedUser(async (args: { id: ID }, user: WithId<User>, context: Context): Promise<boolean> => {
                try {
                    await mongoService.Users.removeFriend(user._id, new ObjectId(args.id))
                } catch(e) {
                    throw new GraphQLError(this.errorHandling(e))
                }

                return true
            })
        }
    }

    withAuthorizedUser<ArgsT, ResulT>(handler: (args: ArgsT, user: WithId<User>, context: Context) => Promise<ResulT>): (args: ArgsT, context: Context) => Promise<ResulT> {
        return async (args: ArgsT, context: Context) => {
            if(context.user == null) {
                throw new GraphQLError("Unauthorized!")
            }

            return handler(args, context.user, context)
        }
    }
    
    errorHandling(e: any): string {
        console.log(e)

        let message = ''
        if (typeof e === "string") {
            message = e.toUpperCase()
        } else if (e instanceof Error) {
            message = e.message
        }

        console.log(message)
        return message
    }

    public getSubscription() {
        return {
            greetings: async function* () {
                yield "a"
            }
        }
    }

    public getRoot() {
        return {
            ...this.getQuery(),
            ...this.getMutation(),
            ...this.getSubscription()
        }
    }
}
