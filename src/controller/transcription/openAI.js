// const completion = await openai.chat.completions.create({
//     model: "gpt-3.5-turbo",
//     response_format: "json",
//     messages: [
//         {
//             role: "system",
//             content: `You are going to generate a title and a nice description using the speech to text transcription provided: transcription(${transcription}). Return JSON like {"title": <title>, "summary": <summary>}`,
//         },
//     ],
// });