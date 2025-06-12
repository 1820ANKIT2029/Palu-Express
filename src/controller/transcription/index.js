import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { summary } from "./gemini.js";
import OpenAI from "openai";

async function transcribeLocally(filePath) {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    try {
        const response = await axios.post(process.env.WHISPER_LOCAL_HOST, form, {
            headers: form.getHeaders(),
        });
        return response.data.text;
    } catch (err) {
        console.log("Error transcribing:", err.message);
        throw err;
    }
}

async function transcribeOpenAi(filePath) {
    const openai = new OpenAI({
        apiKey: process.env.OPEN_AI_KEY
    })

    try {
        const translation = await openai.audio.translations.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
            response_format: 'text',
        });
        return translation.text;
    } catch (err) {
        console.log("Error transcribing:", err.message);
        throw err;
    }
}


export async function handleTranscription(data) {
    try {
        const filePath = `temp_upload/${data.filename}`;
        const { stat } = fs.promises;
        const fileStats = await stat(filePath);

        if (fileStats.size >= 25 * 1024 * 1024) {
            console.log("🔴 File too large (>25MB)");
            return;
        }


        // const transcription = await transcribeLocally(filePath)
        const transcription = await transcribeOpenAi(filePath)
        console.log(transcription)

        if (transcription) {
            const content = await summary(transcription);

            return {transcription, content};
        }

        return { transcription: "", content: { title: "No Title Generated", summary: "text" }}
    } catch (err) {
        console.log("⚠️ Error in processing transcription:", err.message);
        return { transcription: "", content: { title: "No Title Generated", summary: "text" }};
    }
}