# Online Internship Platform

A MERN student project with a React frontend, Express API, and MongoDB persistence.

## Prerequisites

- Node.js 18+
- A MongoDB connection string (local MongoDB or MongoDB Atlas)

## Environment setup

Create a `.env` file in the project root:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/online_internship_platform
PORT=5000
```

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:5000`.

## Data model

- `users`
- `internships`
- `applications`

On first run, the server seeds sample internships if the internships collection is empty.

## Build notes

- React source lives in `client/src`
- Express API lives in `server`
- The browser bundle is generated to `bundle.js`
