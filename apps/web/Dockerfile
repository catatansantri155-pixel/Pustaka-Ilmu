FROM node:20-alpine AS build
WORKDIR /app
COPY apps/web/package*.json ./
COPY apps/web/.npmrc ./
RUN npm ci --no-audit --no-fund
COPY apps/web ./
COPY packages /packages
ARG NEXT_PUBLIC_API_BASE=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
RUN npm run build
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
COPY --from=build /packages /packages
USER node
EXPOSE 3000
CMD ["npm", "start", "--", "-H", "0.0.0.0"]
