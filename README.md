# GhostPost · Speak freely. Stay anonymous.

GhostPost is a complete, production-quality anonymous, location-based, Reddit-style social discussion platform built using the MERN stack (MongoDB, Express, React, Node.js). 

It features browser geolocation tracking, configurable geospatial queries (1km to 25km), coordinate privacy-masking rules, nested reply threads, Hot/New/Top sorting filters, an admin moderation dashboard, and interactive **Swagger / OpenAPI 3.0** API documentation.

---

## 🚀 Key Features

*   **Anonymous Identity System**: Zero-barrier lightweight sessions automatically generate a random `anonHandle` (e.g., `ShadowFox42`) and gradient SVG avatar on first access.
*   **Three Feed Geolocation Contexts**:
    *   **Nearby**: Displays posts around the user's browser GPS coordinates.
    *   **Home Circle**: Displays posts around a saved permanent home location coordinates.
    *   **Global**: Displays posts from all locations without requiring GPS access.
*   **Privacy-First Architecture**: Exact coordinate fields are filtered server-side and never returned over public network APIs, rendering safe category ranges like `"Within 5 km"` instead.
*   **Reddit-Style Sorting**: Sort global and search feeds by **New** (creation time), **Top** (highest net vote score), or **Hot** (using a decay-ranking algorithm in `rankingService.js`).
*   **Nested Discussion Threads**: Supports O(N) recursive thread mapping on the backend, allowing users to comment and reply to replies infinitely.
*   **Moderation Panel**: A dashboard for admin-role users to review flagged posts and comments, resolved by dismissing reports or removing content.
*   **Interactive Swagger Documentation**: Built-in OpenAPI 3.0 specification with Swagger UI interface at `/api-docs` for in-browser API testing and schema inspection.

---

## 🛠 Tech Stack

*   **Frontend**: React (Vite), React Router, Tailwind CSS, Axios, Lucide Icons
*   **Backend**: Node.js, Express.js, REST API, Mongoose, JWT, bcryptjs, Helmet, CORS, **Swagger UI (`swagger-ui-express`, `swagger-jsdoc`)**
*   **Database**: MongoDB, MongoDB Atlas (with `2dsphere` spatial and `text` content indices)
*   **Security**: express-rate-limit, Helmet headers, request limits, CORS rules, coordinate masking

---

## 📂 Project Structure

```
ghostpost/
│
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI elements (PostCard, VoteButtons, etc.)
│   │   ├── context/            # AuthContext, GeolocationContext
│   │   ├── layouts/            # MainLayout
│   │   ├── lib/                # API client (Axios with refresh token interceptors)
│   │   ├── pages/              # GlobalFeed, NearbyFeed, HomeFeed, Settings, Mod Panel
│   │   ├── services/           # Service files for API requests
│   │   └── utils/              # Helper utilities (timeAgo, SVG avatar generators)
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # DB connection configuration & Swagger OpenAPI spec
│   │   ├── controllers/        # Controllers (Auth, Post, Comment, Report)
│   │   ├── middleware/         # Middlewares (Auth, RateLimiter, ErrorHandler)
│   │   ├── models/             # Mongoose schemas (User, Post, Comment, Vote, Report)
│   │   ├── routes/             # REST route maps (OpenAPI annotated)
│   │   ├── services/           # RankingService, Geolocation PrivacyService
│   │   └── utils/              # JWT, identity, and seeder utilities
│   ├── tests/                  # Integration tests (Jest & Supertest)
│   └── package.json
```

---

## ⚙️ Environment Variables

Create `server/.env` from the provided `server/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ghostpost
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Configurable Rate Limits (per 15 minutes window)
MAX_POSTS_PER_WINDOW=10
MAX_COMMENTS_PER_WINDOW=20
MAX_REPORTS_PER_WINDOW=5
VOTE_LIMIT_PER_WINDOW=100
```

---

## 💻 Local Setup & Installation

### Prerequisite
Ensure a local MongoDB server instance is active (typically port `27017`).

### 1. Clone & Install Dependencies
Run npm install in both workspaces:
```bash
# Server Workspace Setup
cd server
npm install

# Client Workspace Setup
cd ../client
npm install --legacy-peer-deps
```

### 2. Seed Mock Database Data
Create sample users, posts around Udaipur coordinates, comments, and reports:
```bash
cd server
npm run seed
```

### 3. Run Application
Start the backend Express server and the frontend Vite development server:
```bash
# Start Express Server (port 5000)
cd server
npm run dev

# Start Vite React Client (port 5173)
cd client
npm run dev
```

### 4. Running Integration Tests
Run backend Jest test suites:
```bash
cd server
npm run test
```

---

## 📚 Interactive API Documentation (Swagger)

Once the backend Express server is running on port `5000`, open your browser to access the live Swagger UI:

* **Interactive Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
* **Raw OpenAPI 3.0 Spec**: [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json)

---

## 📍 Geolocation & Privacy Implementation

> [!IMPORTANT]
> **Privacy Masking Formula:**
> 1. Coordinates are stored in MongoDB as standard GeoJSON Point fields:
>    `{ type: "Point", coordinates: [ longitude, latitude ] }`
> 2. They are query-filtered using `$nearSphere` or `$geoWithin` with a `2dsphere` index.
> 3. The backend calculates distances using the Haversine formula and maps them to a category label:
>    * `< 100m` ➡️ `"Just here"`
>    * `< 1km`  ➡️ `"Within 1 km"`
>    * `< 5km`  ➡️ `"Within 5 km"`
>    * `< 10km` ➡️ `"Within 10 km"`
>    * `< 25km` ➡️ `"Within 25 km"`
> 4. The raw coordinate fields are completely removed from JSON output before API dispatch.

---

## 📖 REST API Reference

*(For full request/response payload schemas and live endpoint testing, visit `/api-docs`)*

### Session Auth
*   `POST /api/auth/register` — Register a new account.
*   `POST /api/auth/login` — Login user account.
*   `POST /api/auth/refresh` — Refresh expired JWT access token.
*   `POST /api/auth/logout` — Logout session.

### Users
*   `GET /api/users/me` — Retrieve active profile.
*   `PATCH /api/users/me` — Update display name.
*   `PATCH /api/users/me/password` — Change account password.
*   `PATCH /api/users/me/home` — Set/update Home coordinates (`{ latitude, longitude }`).
*   `DELETE /api/users/me/home` — Delete Home coordinates.
*   `GET /api/users/me/bookmarks` — Get bookmarked posts.
*   `POST /api/users/me/bookmarks/:postId` — Bookmark a post.
*   `DELETE /api/users/me/bookmarks/:postId` — Remove post bookmark.
*   `POST /api/users/:id/follow` — Follow a handle.
*   `POST /api/users/:id/unfollow` — Unfollow a handle.
*   `GET /api/users/:username` — Public profile details.

### Feed & Posts
*   `GET /api/posts/global?sort=hot` — Global Feed (cursor-paginated).
*   `GET /api/posts/nearby?lat=xx&lng=xx&radius=10` — Nearby Feed (radius: 1, 5, 10, 25).
*   `GET /api/posts/home` — Home feed (uses saved user home coords).
*   `GET /api/posts/following` — Following feed.
*   `GET /api/posts/search?q=query` — Full-text post search.
*   `POST /api/posts` — Publish post (accepts optional `latitude, longitude` to tag location).
*   `GET /api/posts/:id` — Single post details.
*   `DELETE /api/posts/:id` — Delete post (author or admin only).
*   `POST /api/posts/:id/vote` — Upvote/Downvote post (`{ value: 1 or -1 }`).
*   `DELETE /api/posts/:id/vote` — Remove vote.

### Comments
*   `GET /api/posts/:id/comments` — Load comment tree (structured hierarchy).
*   `POST /api/posts/:id/comments` — Create comment/reply.
*   `DELETE /api/comments/:id` — Delete comment.
*   `POST /api/comments/:id/vote` — Upvote/Downvote comment (`{ value: 1 or -1 }`).

### Moderation
*   `POST /api/reports` — Report post or comment.
*   `GET /api/admin/reports` — View reported content flags (Admin only).
*   `PATCH /api/admin/reports/:id` — Resolve or dismiss report (Admin only).
