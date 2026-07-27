FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json backend/
RUN cd backend && npm ci --omit=dev

COPY frontend/package*.json frontend/
RUN cd frontend && npm ci && npm run build

COPY backend/ backend/
COPY frontend/src/ frontend/src/
COPY frontend/index.html frontend/
COPY frontend/vite.config.js frontend/
COPY frontend/tailwind.config.js frontend/
COPY frontend/postcss.config.js frontend/

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "backend/server.js"]
