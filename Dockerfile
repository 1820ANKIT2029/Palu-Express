# Stage 1:
FROM node:22-slim AS base

# Install system dependencies including Python and build tools
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    git ffmpeg build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Copy Python requirements and install
RUN python3 -m venv /venv
COPY requirements.txt ./
RUN /venv/bin/pip install --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p temp_upload


# Stage 2: development
FROM base AS development
# volume (-v ./:/usr/src/app)
ENV NODE_ENV=development

EXPOSE 3000 8000

CMD ["sh", "-c", "npm run dev & uvicorn main:app --reload & wait"]


# Stage 3: production
FROM base AS production
COPY . .

EXPOSE 3000 8000

# Set environment variables
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/usr/src/app

CMD ["sh", "-c", "npm run start & uvicorn main:app & wait"]
