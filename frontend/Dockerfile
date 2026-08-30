FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the frontend port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
