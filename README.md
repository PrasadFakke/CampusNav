# CampusNav – Login + MongoDB Auth

Modern login/register UI + Node.js backend connected to MongoDB.  
Ready for your **Campus Navigation** mini project.

---

## Features

- Beautiful dark UI (HTML + CSS)
- Login & Register tabs
- Password show/hide
- Username + password stored in MongoDB (hashed with bcrypt)
- JWT token after successful login
- Responsive design

---

## Folder Structure

```
campus-nav-login/
├── public/
│   └── index.html          ← Login page
├── css/
│   └── style.css
├── js/
│   └── auth.js
├── models/
│   └── User.js
├── routes/
│   └── auth.js
├── server.js
├── package.json
├── .env.example
└── README.md
```

---

## How to Run (Step by Step)

### 1. Install Node.js
Make sure Node.js is installed (https://nodejs.org)

### 2. Install MongoDB

**Option A – Local MongoDB**
- Install MongoDB Community Edition
- Start the service (usually `mongod` or via MongoDB Compass)

**Option B – MongoDB Atlas (Cloud – recommended for students)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user + allow network access (0.0.0.0/0 for testing)
4. Copy the connection string

### 3. Setup project

```bash
cd campus-nav-login
npm install
```

### 4. Create `.env` file

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/campusnav
JWT_SECRET=any_long_random_string
```

For Atlas, replace `MONGO_URI` with your Atlas connection string.

### 5. Start the server

```bash
npm start
```

Open: **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | `/api/auth/register`  | Create new user          |
| POST   | `/api/auth/login`     | Login & get JWT token    |
| GET    | `/api/auth/me`        | Get current user (token) |

**Register body example:**
```json
{
  "username": "student1",
  "email": "student1@college.edu",
  "password": "mypassword"
}
```

**Login body example:**
```json
{
  "username": "student1",
  "password": "mypassword"
}
```

---

## After Login

On successful login the frontend:
- Saves `token` and `user` in `localStorage`
- Redirects to `/dashboard.html` (you can create this page later for the map)

You can protect future routes by checking the JWT.

---

## Next Steps for Campus Navigation Project

1. Create `public/dashboard.html` – main map / navigation page
2. Use the stored token to identify the logged-in student
3. Add buildings, routes, search, etc.
4. Optionally store favourite locations per user in MongoDB

---

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JS
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: bcryptjs + JWT

Happy coding! 🚀
