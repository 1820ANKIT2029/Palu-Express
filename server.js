import express from 'express';
import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import { Server } from 'socket.io'
import fs from 'fs'
import { Readable } from 'stream'

dotenv.config()

const app = express()
const server = http.createServer(app)

const PORT = process.env.PORT || 5001

app.use(cors())

const io = new Server(server, {
    cors: {
        origin: process.env.ELECTRON_HOST,
        methods: ['GET', 'POST'],
    },
})


let recordedChunks = [];

io.on("connection", (socket) => {
    console.log(`${socket.id} connected`)

    socket.on('video-chunks', async (data) => {
        console.log('Video chunk is sent', data.filename)
        const writestream = fs.createWriteStream('temp_upload/'+ data.filename)
        recordedChunks.push((data.chunks))

        const videoBlob = new Blob(recordedChunks, {
            type: 'video/webm; codecs=vp9',
        })

        const buffer = Buffer.from(await videoBlob.arrayBuffer())
        const readStream = Readable.from(buffer)
        readStream.pipe(writestream).on('finish', () => {
            console.log('Chunk data...', data.filename)
        })
    })

    socket.on('process-video', async (data) => {
        console.log('Processing video', data)
    })

    socket.on('disconnect', async () => {
        console.log(`${socket.id} is disconnected`)
    })
})


server.listen(PORT, ()=>{
    console.log(`Listening on ${PORT}`)
})
