FROM node:20-alpine

WORKDIR /app

# Placeholder - frontend will be scaffolded in Session 2
# For now, serve a simple holding page
RUN npm install -g serve

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "if [ -f package.json ]; then npm install && npm run dev -- --host 0.0.0.0 --port 3000; else serve -s . -l 3000; fi"]
