# Use a Node.js base image
FROM node:18

# Set the working directory
WORKDIR /my-app

# Copy package.json and package-lock.json
COPY package.json ./ 
COPY package-lock.json ./ 

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port that your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]


############### FOR NGINX ###############
# # Use a Node.js base image
# FROM node:18 AS build

# # Set the working directory
# WORKDIR /my-app

# # Copy package.json and package-lock.json
# COPY package.json ./
# COPY package-lock.json ./

# # Install dependencies
# RUN npm install

# # Copy the rest of the application
# COPY . .

# # Build the application
# RUN npm run build

# # Use a lightweight web server to serve the app
# FROM nginx:alpine

# # Copy built files from the previous stage
# COPY --from=build /my-app/build /usr/share/nginx/html

# # Expose the port
# EXPOSE 3000

# # Start Nginx
# CMD ["nginx", "-g", "daemon off;"]
