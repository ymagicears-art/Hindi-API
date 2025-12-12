# Use Node base image (Debian variant)
FROM node:18-bullseye

# Install tesseract and Hindi language pack + small tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-hin \
    libtesseract-dev \
    imagemagick \
 && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy app code
COPY . .

# Expose port (Render provides $PORT at runtime; this is just informative)
EXPOSE 10000

# Start the app
CMD ["npm", "start"]
