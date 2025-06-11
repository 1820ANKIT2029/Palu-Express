
# Palu-Express

This a server for live video storing in temp folder and then upload to S3 bucket once user stop recording. It use Socket.IO for real time communication.

Start all three server to use Palu.

This Palu has three components:
- [**Palu-Web**][1] (for video and workspace management)
- [**Palu-Desktop**][2] (for video recording)
- [**Palu-Express**][3] (for real time video processing and storing in S3)

## Features

- **Screen Recording**: Record your entire screen, specific application windows, or browser tabs.
- **Webcam Recording**: Capture video directly from your webcam.
- **Audio Recording**: Support for system audio, microphone input, or both.
- **Video Editing**: Basic editing features like trimming, cropping, and adding captions.
- **Sharing**: Generate shareable links for recorded videos.
- **Cloud Storage**: Store videos securely in the cloud.
- **User Authentication**: Sign up, log in, and manage accounts securely.
- **Real-Time Notifications**: Notify users when their videos are processed and ready to share.

## Tech Stack

- **Framework**: Express.js
- **Real time comm**: Socket.io

## Installation

### Prerequisites
- Node.js (v16 or higher)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/1820ANKIT2029/Palu-Express.git
   cd Palu-Express
   ```

   also install ffmpeg before installing dependencies

2. Install dependencies:
   ```bash
   npm install
   python -m venv .venv
   source ./.venv/Scripts/activate
   pip -r requirement.txt
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the api key as in .env.example.

4. Start the development server:
   ```bash
   npm run dev
   ```

   ```bash
   uvicorn main:app
   ```

Docker
   ```bash
   docker-compose --profile dev up --build
   ```

   ```bash
   docker-compose up --build
   ```


---

Happy Recording! 🎥

[1]: https://github.com/1820ANKIT2029/Palu-Web            "Palu-Web"
[2]: https://github.com/1820ANKIT2029/Palu-Desktop        "Palu-Desktop"
[3]: https://github.com/1820ANKIT2029/Palu-Express      "Palu-Express"
