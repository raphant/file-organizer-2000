# Use an official Node.js runtime as the base image
FROM node:18

# Install pnpm
RUN npm install -g pnpm

# Set the working directory in the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY web/package*.json ./
COPY web/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY web/ .

# Build the Next.js application
RUN pnpm run build:self-host

# Expose the port on which the application will run
EXPOSE 3000

# Set the command to run the application
CMD ["pnpm", "start"]