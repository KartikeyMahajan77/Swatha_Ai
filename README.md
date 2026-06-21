# AI Therapist Project

AI Therapist Project is a full-stack mental wellness application with a Next.js frontend and an Express/TypeScript backend. It includes AI chat support, user authentication, mood tracking, activity tracking, therapist flows, appointment management, and session history.

This project is built for local development with two apps running side by side:

- `frontend/`: Next.js web application
- `backend/`: Express API server with MongoDB, Socket.IO, Groq AI, and Inngest

## Features

- User registration and login
- AI therapist chat sessions
- Chat history and session management
- Mood tracking
- Activity tracking
- Therapist registration and login
- Appointment booking and therapist session flows
- Admin-related routes
- AI-generated therapy responses using Groq
- MongoDB data storage

## Tech Stack

Frontend:

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui style components
- Axios
- Socket.IO client

Backend:

- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- Groq SDK
- Inngest
- Socket.IO
- Winston logging

## Project Structure

```text
ai-therapist-project/
  backend/
    src/
      controllers/
      routes/
      models/
      middleware/
      socket/
      inngest/
      utils/
    package.json
    tsconfig.json

  frontend/
    app/
    components/
    lib/
    hooks/
    public/
    package.json
    tsconfig.json

  .gitignore
  README.md
```

## Prerequisites

Install these before running the project:

- Node.js 18 or newer
- npm
- MongoDB local server or MongoDB Atlas connection string
- Groq API key

Check your versions:

```bash
node -v
npm -v
```

## Environment Variables

Create a `.env` file inside `backend/`:

```bash
cd backend
touch .env
```

Add these values:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/ai-therapist
JWT_SECRET=replace_with_a_strong_secret
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key_optional
DEMO_ALLOW_EARLY_SESSION=true
```

Notes:

- `MONGODB_URI` can be a local MongoDB URL or a MongoDB Atlas URL.
- `GROQ_API_KEY` is required for AI chat responses.
- `JWT_SECRET` should be changed before production use.
- `GEMINI_API_KEY` is referenced by some backend AI/Inngest code. Add it if you use those flows.

Create a `.env.local` file inside `frontend/`:

```bash
cd ../frontend
touch .env.local
```

Add:

```env
BACKEND_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001
BACKEND_URL=http://localhost:3001
```

## How To Run The Project

Open two terminal windows: one for the backend and one for the frontend.

### 1. Install Backend Dependencies

From the project root:

```bash
cd backend
npm install
```

### 2. Start MongoDB

If you use local MongoDB, make sure MongoDB is running.

On many Linux systems:

```bash
sudo systemctl start mongod
```

If you use MongoDB Atlas, set `MONGODB_URI` in `backend/.env` to your Atlas connection string.

### 3. Start Backend Server

```bash
cd backend
npm run dev
```

The backend should run at:

```text
http://localhost:3001
```

Health check:

```text
http://localhost:3001/health
```

### 4. Install Frontend Dependencies

In a second terminal, from the project root:

```bash
cd frontend
npm install
```

### 5. Start Frontend Server

```bash
cd frontend
npm run dev
```

The frontend should run at:

```text
http://localhost:3000
```

Open the app in your browser:

```text
http://localhost:3000
```

## Useful Scripts

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run start
```

## Git And Push Notes

This project is intended to be pushed as one root repository containing both `backend/` and `frontend/`.

Before pushing, make sure these files are not committed:

- `backend/.env`
- `frontend/.env.local`
- `backend/*.log`
- `backend/node_modules/`
- `frontend/node_modules/`
- `frontend/.next/`

The root `.gitignore` and app-level `.gitignore` files are set up to ignore these files.

Typical first push from the root folder:

```bash
git status
git add .
git commit -m "Initial full-stack project commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

If the remote already exists:

```bash
git remote -v
git push -u origin main
```

## Troubleshooting

Backend cannot connect to MongoDB:

- Check that MongoDB is running.
- Check `MONGODB_URI` in `backend/.env`.
- If using Atlas, make sure your IP address is allowed in MongoDB Atlas.

AI chat is not working:

- Check that `GROQ_API_KEY` exists in `backend/.env`.
- Restart the backend after changing `.env`.

Frontend cannot reach backend:

- Make sure backend is running on port `3001`.
- Check `BACKEND_API_URL` and `NEXT_PUBLIC_BACKEND_API_URL` in `frontend/.env.local`.
- Restart the frontend after changing `.env.local`.

Port already in use:

- Stop the process using the port, or change `PORT` in `backend/.env`.

## Important Safety Note

This app provides mental wellness support, but it is not a replacement for licensed medical, psychological, or emergency care. If someone is in immediate danger or thinking about self-harm, they should contact local emergency services or a trusted person immediately.
