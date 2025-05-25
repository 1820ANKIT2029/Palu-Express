from fastapi import FastAPI, UploadFile, File
import whisper
import tempfile
import os

app = FastAPI()
model = whisper.load_model("base")

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        suffix = os.path.splitext(file.filename)[-1] or ".mp3"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
            temp_audio.write(await file.read())
            temp_audio_path = temp_audio.name

        result = model.transcribe(temp_audio_path)
        return {"text": result["text"]}

    except Exception as e:
        return {"error": str(e)}

