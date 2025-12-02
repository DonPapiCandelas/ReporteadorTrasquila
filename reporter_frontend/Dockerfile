FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# CAMBIO 1: Vite usa el puerto 5173
EXPOSE 5173

# CAMBIO 2: Usamos 'npm run dev' y agregamos '-- --host'
# Ese '--host' es OBLIGATORIO para que puedas ver la web desde tu Windows
CMD ["npm", "run", "dev", "--", "--host"]