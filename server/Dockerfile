FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

# Persisted, encrypted transcript/minutes storage (mount a volume here in production)
RUN mkdir -p /app/.data
ENV STORAGE_DIR=/app/.data

EXPOSE 4000
CMD ["node", "index.js"]
