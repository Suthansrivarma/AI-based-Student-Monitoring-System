# Deployment 
https://ai-based-student-monitoring-system.vercel.app/

# AI-based Student Monitoring System

Smart attendance and student monitoring platform with:
- React frontend (`frontend`)
- Node.js + Express + MongoDB backend (`server`)
- Python OpenCV face-recognition module (`face_recognition`)

## Features
- Student registration and login
- Admin approval/deactivation of students
- Daily attendance tracking
- Onduty request workflow (with file upload)
- Event management
- Real-time updates via Socket.IO
- Face-recognition-based attendance marking

## Project Structure
```text
smart-attendance-system/
|-- frontend/           # React app
|-- server/             # Express API + Socket.IO + MongoDB
|-- face_recognition/   # Python scripts for register/train/attendance
`-- README.md
```

## Tech Stack
- Frontend: React, Tailwind CSS (PostCSS), Axios, Socket.IO client
- Backend: Node.js, Express, Mongoose, JWT, Multer, Socket.IO
- Face Recognition: Python, OpenCV, NumPy, python-socketio
- Database: MongoDB Atlas

## Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Git
- Webcam (for face-recognition attendance)

## Environment Variables

### Backend (`server/.env`)
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

For production, set `CORS_ORIGIN` to your frontend domain, for example:
```env
CORS_ORIGIN=https://your-frontend.vercel.app,http://localhost:3000
```

### Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

For production:
```env
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_SOCKET_URL=https://your-backend.onrender.com
```

## Local Setup

### 1) Backend
```powershell
cd server
npm install
npm start
```

Backend runs on `http://localhost:5000`.

### 2) Frontend
```powershell
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`.

### 3) Face Recognition (optional but required for camera attendance)
```powershell
cd face_recognition
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
pip install opencv-contrib-python python-socketio
```

## Face Recognition Workflow

### Register a person
```powershell
cd face_recognition
python register.py
```

### Train model
```powershell
python train.py
```

### Run attendance scan
```powershell
python attendance.py
```

By default, `attendance.py` sends attendance to `http://localhost:5000` through Socket.IO.

## Default Admin Account
On backend startup, an admin is auto-created if not present:
- Email: `admin@gmail.com`
- Password: `admin123`

Change this in production.

## API Overview
- `POST /api/register` - student registration
- `POST /api/login` - login and JWT token
- `GET /api/admin/students` - list students (admin)
- `POST /api/admin/approve` - approve student (admin)
- `POST /api/admin/deactivate` - deactivate student (admin)
- `GET /api/admin/attendance` - today attendance (admin)
- `POST /api/onduty` - create onduty request (student)
- `GET /api/onduty` - list onduty requests (admin)
- `GET /api/student/onduty` - list own onduty requests (student)
- `POST /api/onduty/action` - approve/reject onduty (admin)
- `POST /api/events` - create event (admin)
- `GET /api/events` - list events

## Deployment

### Recommended Split
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Face Recognition: local/lab machine (needs webcam access)

### Backend (Render)
- Root directory: `server`
- Build command: `npm ci`
- Start command: `npm start`
- Set env vars:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `CORS_ORIGIN=https://your-frontend.vercel.app`

### Frontend (Vercel)
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `build`
- Env vars:
  - `REACT_APP_API_URL=https://your-backend.onrender.com`
  - `REACT_APP_SOCKET_URL=https://your-backend.onrender.com`


