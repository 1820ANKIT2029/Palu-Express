import express from 'express';
import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import { Server } from 'socket.io'
import fs from 'fs'
import { Readable } from 'stream'
import axios from 'axios';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import OpenAI from 'openai';

dotenv.config()


const app = express()
const server = http.createServer(app)

const PORT = process.env.PORT || 5001

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
})

const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_KEY,
    },
    region: process.env.BUCKET_REGION,
})

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
        recordedChunks = []
        fs.readFile('temp_upload/' + data.filename, async (err, file) => {
            const processing = await axios.post(
                `${process.env.NEXT_API_HOST}recording/${data.userId}/processing`,
                { filename: data.filename }
            )
            if(processing.data.status !== 200) 
                return console.log("🔴 Error: something went wrong with creating the processing file")

            const Key = data.filename
            const Bucket = process.env.BUCKET_NAME
            const ContentType = 'video/webm'
            const command = new PutObjectCommand({
                Key,
                Bucket,
                ContentType,
                Body: file,
            })

            const fileStatus = await s3.send(command)

            if(fileStatus['$metadata'].httpStatusCode === 200){
                console.log('Video Uploaded To AWS')

                if(processing.data.plan === 'PRO'){
                    fs.stat('temp_upload/' + data.filename, async (err, stat) => {
                        if(!err){
                            if(stat.size < 25000000){
                                const transcription = await openai.audio.transcriptions.create({
                                    file: fs.createReadStream(`temp_upload/${data.filename}`),
                                    model: 'whisper-1',
                                    response_format: 'text',
                                })

                                if(transcription){
                                    const completion = await openai.chat.completions.create({
                                        model: 'gpt-3.5-turbo',
                                        response_format: { type: 'json_object'},
                                        messages: [
                                            {
                                                role: 'system',
                                                content: `You are going to generate a title and a nice description using the speech to text transcription provided: transcription(${transcription}) and then return it in json format as {"title": <the tilte you gave>, "summery": <the summary you created>}`,
                                            },
                                        ],
                                    })

                                    const titleAndSummeryGenerated = await axios.Axios.post(
                                        `${process.env.NEXT_API_HOST}recording/${data.userId}/transcribe`,
                                        {
                                            filename: data.filename,
                                            content: completion.choices[0].message.content,
                                            transcript: transcription
                                        }
                                    )

                                    if(titleAndSummeryGenerated.data.status !== 200){
                                        console.log('🔴 error: something went wrong when creating the title and description')
                                    }
                                }
                            }
                        }
                    })
                }

                const stopProcessing = await axios.post(
                    `${process.env.NEXT_API_HOST}recording/${data.userId}/complete`,
                    { filename: data.filename }
                )

                if(stopProcessing.data.status !== 200){
                    console.log('🔴 error: something went wrong when stopping the process and trying to complete the processing stage.')
                    if(stopProcessing.status === 200){
                        fs.unlink('temp_upload/' + data.filename, (err) => {
                            if(!err) console.log(data.filename + " " + "deleted successfully")
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


server.listen(PORT, ()=>{
    console.log(`Listening on ${PORT}`)
})
