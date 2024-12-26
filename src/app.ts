import { createHandler } from 'graphql-http/lib/use/express'
import { mongoService } from './services/db/db'
import Resolvers from './schemas/resolvers'
import { Context, User } from './schemas/types'
import { buildSchema, GraphQLError } from 'graphql'
import { readFileSync } from 'fs'
import express from 'express'
import { WithId } from 'mongodb'
import { FormatError } from 'graphql-http'
import CustomError from './CustomError'

const app = express()
const resolvers: Resolvers = new Resolvers()

let schemaDSL = readFileSync('./src/schemas/schema.graphql', 'utf-8')
const schema = buildSchema(schemaDSL)

async function getContext(req: any): Promise<Context> {
    const token: string | null = req.headers['token']
    
    if(token) {
        return {
            user: await tokenVerification(token),
            token,
        }
    }

    return {
        user: null,
        token: null,
    }
}

async function tokenVerification(token: string): Promise<WithId<User> | null> {
    const session = await mongoService.Sessions.checkSessionByTokenString(token)

    if(session) {
        return await mongoService.Users.getUser(session.userId)
    }

    return null
}

const format = (error: Readonly<Error | GraphQLError>): GraphQLError => {
    console.log(error)

    if(error.message.startsWith('<CustomError>')) {
        const message = error.message.replace('<CustomError>', '');
        return new GraphQLError(message)
    }
    
    return new GraphQLError('Internal Error')
}

app.all('/graphql', createHandler({ 
    schema,
    context: getContext,
    rootValue: resolvers.getRoot(),
    formatError: format
}))

export default app