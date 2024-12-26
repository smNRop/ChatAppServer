import { ObjectId, WithId } from 'mongodb'

export type RegistrationInput = {
    email: string
    password: string
    userName: string
    displayName: string
    birthDate: Date
};

export type LoginInput = {
    email: string
    password: string
}

export type User = {
    email: string
    password: string
    salt: string
    userName: string
    displayName: string
    birthDate: Date
}

export type Server = {
    name: string
    users: ServerUser[]
    channel: ServerChannel[]
}

export type ServerUser = {
    user: ObjectId,
    role: ServerRole
}

export type ServerChannel = {
    name: string,
    type: ServerChannelType
}

export enum ServerChannelType {
    CHAT,
    VOICE
}

export enum ServerRole {
    OWNER,
    USER
}

export type Session = {
    userId: ObjectId
    createdAt: Date
}

export type Relation = {
    users: [ObjectId, ObjectId]
    type: RelationType
}

export enum RelationType {
    FRIENDS,
    REQUESTED,
    BLOCKED
}

//export type User = Omit<UserDb, 'password' | '_id'>
export type PublicUser = Pick<User, 'displayName' | 'userName'>
export type PrivateUser = Pick<User, 'displayName' | 'userName'>

export type Context = {
    user: WithId<User> | null
    token: string | null
}

export type ID = string