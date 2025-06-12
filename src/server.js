import express from 'express';
import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import { Server } from 'socket.io'
import fs from 'fs'
import { Readable } from 'stream'
import axios from 'axios';
import { add_storageType_with_filename } from './utils.js';
import { upload_video_to_cloud } from './controller/cloudStorageLogic/index.js';
import { handleTranscription } from './controller/transcription/index.js';

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

io.on("connection", (socket) => {
    console.log(`${socket.id} connected`)

    let recordedChunks = [];

    socket.on('video-chunks', async (data) => {
        console.log('Video chunk is sent', data.filename)
        const writestream = fs.createWriteStream('temp_upload/' + data.filename)
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
        recordedChunks = []

        fs.readFile('temp_upload/' + data.filename, async (err, file) => {

            const newFileName = add_storageType_with_filename(data.filename, process.env.STORAGE_TYPE)

            const processing = await axios.post(
                `${process.env.NEXT_API_HOST}recording/${data.userId}/processing`,
                { filename: newFileName }
            )
            
            if (processing.data.status !== 200)
                return console.log("🔴 Error: something went wrong with creating the processing file")

            const uploadStatus = await upload_video_to_cloud(newFileName, 'video/webm', file);

            if (uploadStatus['statusCode'] === 200) {
                console.log(`Video Uploaded To Cloud ${process.env.STORAGE_TYPE}`)

                if (processing.data.plan === 'PRO') {
                    let {transcription, content} = await handleTranscription(data);

                    const titleAndSummaryGenerated = await axios.post(
                        `${process.env.NEXT_API_HOST}recording/${data.userId}/transcribe`,
                        {
                            filename: newFileName,
                            content: JSON.stringify(content),
                            transcript: transcription,
                        }
                    );

                    if (titleAndSummaryGenerated.data.status !== 200) {
                        console.log("🔴 Error: something went wrong when creating title/summary");
                    }
                }

                const stopProcessing = await axios.post(
                    `${process.env.NEXT_API_HOST}recording/${data.userId}/complete`,
                    { filename: newFileName }
                )

                if (stopProcessing.data.status !== 200) {
                    console.log('🔴 error: something went wrong when stopping the process and trying to complete the processing stage.')
                    if (stopProcessing.status === 200) {
                        fs.unlink('temp_upload/' + data.filename, (err) => {
                            if (!err) console.log(data.filename + " " + "deleted successfully")
                        })
                    }
                }
            } else {
                console.log("🔴 Error: upload Failed! processing aborted")
            }
        })
    })

    socket.on('disconnect', async () => {
        console.log(`${socket.id} is disconnected`)
    })
})


server.listen(PORT, () => {
    console.log(`Listening on ${PORT}`)
})
