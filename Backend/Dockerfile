# Use the official Python image from Docker Hub
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /Backend

# Copy the requirements.txt file to the container
COPY Backend/requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend folder into the container
COPY Backend /Backend

# # Expose the port Flask will run on
# EXPOSE 5000

# This will be overridden by Docker Compose for each API
# CMD ["flask", "run"]
