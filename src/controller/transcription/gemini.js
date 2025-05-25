import { GoogleGenAI, Type } from "@google/genai";

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function summary(transcription) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Based on the following speech-to-text transcription: "${transcription}", please generate a concise title and a helpful summary. Return your response as a JSON object with the keys "title" and "summary".`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-lite",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                // responseSchema: {
                //     type: Type.OBJECT,
                //     properties: {
                //         title: {
                //             type: Type.STRING,
                //         },
                //         summary: {
                //             type: Type.STRING,
                //         }
                //     }
                // }
            }
        });

        let text = response.text;

        console.log("Raw text:", text);
        try {
            const jsonResponse = JSON.parse(text);
            console.log("Parsed JSON:", jsonResponse);
            return jsonResponse;
        } catch (e) {
            console.log("Failed to parse JSON:", e.message);
            console.log("Raw response:", text);
            return { title: "No Title Generated", summary: text }; // Return raw text as summary in case of parsing failure
        }
    } catch (error) {
        console.log("Error generating summary:", error.message);
        throw error;
    }
}