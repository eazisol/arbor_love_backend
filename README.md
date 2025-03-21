# Tree Trim Quote API

This project provides an API for managing tree trimming quotes using NestJS and DynamoDB.

## Prerequisites

- Docker
- Node.js
- npm


## Setup

### 1. Pull and Run DynamoDB Local Docker Image

To set up a local DynamoDB instance, use the following Docker commands:

```bash
# Pull the DynamoDB local image from Docker Hub
docker pull amazon/dynamodb-local

# Run the DynamoDB local image on port 8001 (mapped to container's port 8000)
docker run -d -p 8001:8000 amazon/dynamodb-local
```

### 2. Install Dependencies

Navigate to your project directory and install the necessary dependencies:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root of your project and add the necessary environment variables. Here is an example:

```env
# DynamoDB local endpoint
DYNAMODB_ENDPOINT=http://localhost:8001

# Other environment variables as needed
PORT=3000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
```

### 4. Create Tables in DynamoDB

To create tables in the local DynamoDB instance, run the following commands:

```bash
npx ts-node tables/general-table.ts
npx ts-node tables/quote-table.ts
```


### 5. Start the Application

To start the NestJS application, use the following command:

```bash
npm run start:dev
```

This will start the application in development mode.