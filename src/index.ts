// import express from 'express'
// import { WebSocketServer } from 'ws'
// import * as mongodb from 'mongodb'
// import { createHandler } from 'graphql-http/lib/use/express'
// import { useServer } from 'graphql-ws/lib/use/ws'
// import { buildSchema } from 'graphql'
// import * as fs from 'fs'
// import * as types from './schemas/types'
// import { Resolvers } from './schemas/resolvers'
import { mongoService } from './services/db/db'
import app from './app'

const server = app.listen(3000, async () => {
    console.log('Example app listening on port 3000!')

    // const wsServer = new WebSocketServer({
    //     server,
    //     path: '/graphql',
    // });
    
    // useServer({ 
    //     schema,
    //     roots: {
    //         subscription: resolvers.getSubscription()
    //     },

    // }, wsServer)
    
    await mongoService.init()
})



