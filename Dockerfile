FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json backend/
RUN cd backend && npm ci --omit=dev

COPY frontend/package*.json frontend/
RUN cd frontend && npm ci

COPY backend/ backend/
COPY frontend/ frontend/

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

RUN cd frontend && npm run build

CMD ["node", "backend/server.js"]
