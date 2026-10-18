# CodeSphere - Full-Stack Coding Platform

A full-stack coding practice platform with an online editor, code execution, progress tracking, AI help, video tutorials, and team coding rooms.

## Features

- **Authentication and profile:** Sign up and log in with JWT-based sessions. Update your profile and change your password; password changes end older sessions.
- **Problem library:** Browse coding problems with descriptions, examples, constraints, difficulty, and tags.
- **Monaco code editor:** Write solutions in the browser with JavaScript, Java, or C++ editor support.
- **Run code:** Try your solution against the problem's visible examples and inspect each test result without recording a submission.
- **Submit solution:** Send code to Judge0 for evaluation against the problem's test cases. The result and submission history are saved to your account.
- **Progress dashboard:** Review solved-problem count, acceptance rate, current streak, total submissions, activity by day, difficulty breakdown, and recent submissions.
- **AI coding assistant:** Ask Gemini for problem-specific hints and explanations from the problem-solving page. Configure `GEMINI_API_KEY` to enable it.
- **Video tutorials:** Watch problem solution videos. Admins can upload and manage videos through Cloudinary; configure the `CLOUD_*` variables to enable uploads.
- **Admin tools:** Authorized admins can create, edit, and delete problems, and manage tutorial videos.
- **Team coding rooms:** Create an invite link from a problem and collaborate with up to two other signed-in users. Room members share live editor changes, see who is online, and chat. MongoDB stores room membership; Redis stores temporary room state and chat. Socket.IO provides real-time updates.
- **Redis caching:** Redis stores cached app data and temporary collaboration state to reduce repeated database work and support room features.

## Tech stack

- **Frontend:** React, Vite, Redux Toolkit, Tailwind CSS, Monaco Editor
- **Backend:** Node.js, Express, Socket.IO
- **Data/cache:** MongoDB Atlas, Redis Cloud
- **Integrations:** Judge0, Gemini, Cloudinary

## Run locally

Requirements: Node.js 22.12+ and npm, plus MongoDB Atlas and Redis Cloud connection URLs. No Docker is required.

1. Copy the environment templates:

   ```powershell
   Copy-Item Backend/.env.example Backend/.env
   Copy-Item frontend/.env.example frontend/.env.local
   ```

2. In `Backend/.env`, set `MONGO_URI`, `REDIS_URL`, and a private `JWT_SECRET`. Add the optional API keys listed below for those features.
3. Start the backend in one terminal:

   ```powershell
   cd Backend
   npm install
   npm run dev
   ```

4. Start the frontend in a second terminal:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

Open the frontend URL printed by Vite. Check backend/database status at `http://localhost:5000/health`.

## Environment variables

Set secrets in `Backend/.env` only. Never put private keys in frontend `VITE_*` variables.

| Variable | Needed for |
| --- | --- |
| `MONGO_URI` | MongoDB Atlas and app data |
| `REDIS_URL` | Redis Cloud; use its TLS URL (`rediss://...`) when provided |
| `JWT_SECRET` | Login and authenticated sessions |
| `JUDGE0_API_KEY` | Run and submit code |
| `GEMINI_API_KEY` | AI coding assistant |
| `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` | Cloudinary video uploads |

## Deploy on Render

The root `render.yaml` configures a backend Web Service and a frontend Static Site, including the API URL, health check, and React Router rewrite. Push the repository to GitHub, then in Render select **New → Blueprint** and connect the repository. Enter the backend secrets when prompted. The frontend and backend service URLs are configured as `codemaster-frontend.onrender.com` and `codemaster-backend.onrender.com`; update `VITE_API_URL`, `FRONTEND_URL`, and `CORS_ORIGINS` if you change those names or use a custom domain. Allow the deployed backend to connect to MongoDB Atlas in Atlas **Network Access**.

The Blueprint uses Render's free backend plan. Free services can sleep after inactivity, so their first request may take about a minute to wake up. Render supports the Socket.IO WebSocket connection used by team rooms.

## License

ISC
