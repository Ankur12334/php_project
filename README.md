# RoomFinder (Listing + Booking Platform)

Full-stack app with:
- Backend: Node.js, Express, MySQL, Sequelize (MVC)
- Frontend: React, Vite, Tailwind
- Auth: Google OAuth token + Phone OTP
- API Docs: Swagger at `/api-docs`

## Roles

1. `admin`
- Full access
- Approve/reject listings
- Manage users/bookings/reports

2. `user`
- Can list rooms
- Can book rooms
- Can view own bookings/listings
- Listing is visible publicly only after admin approval

## Auth Flow (Updated)

### Phone OTP
1. User enters phone
2. `POST /api/auth/otp/send` checks whether user exists and sends OTP
3. `POST /api/auth/otp/verify`
- If user exists: login response with JWT
- If user does not exist: returns `requiresRegistration: true` + `registrationToken`
4. `POST /api/auth/register` completes new-user registration

### Google
1. User submits Google ID token to `POST /api/auth/google`
- If existing user: login response with JWT
- If new user: returns `requiresRegistration: true` + `registrationToken`
2. `POST /api/auth/register` completes registration

## Backend Setup

1. `cd backend`
2. `copy .env.example .env`
3. `npm install`
4. `npm run migrate`
5. `npm run seed`
6. `npm run dev`

Backend: `http://localhost:5000`
Swagger: `http://localhost:5000/api-docs`

## Frontend Setup

1. `cd frontend`
2. `copy .env.example .env`
3. `npm install`
4. `npm run dev`

Frontend: `http://localhost:5173`

## Main APIs

### Auth
- `POST /api/auth/google`
- `POST /api/auth/otp/send`
- `POST /api/auth/otp/verify`
- `POST /api/auth/register`

### Rooms
- `GET /api/rooms`
- `GET /api/rooms/:id`
- `GET /api/rooms/:id/contact`
- `GET /api/rooms/my/listings` (user)
- `POST /api/rooms` (user)
- `PUT /api/rooms/:id` (user)
- `DELETE /api/rooms/:id` (user/admin)

### Bookings
- `POST /api/bookings` (user)
- `GET /api/bookings/user` (user)

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/rooms/pending`
- `PUT /api/admin/rooms/:id/approve`
- `PUT /api/admin/rooms/:id/reject`
- `GET /api/admin/users`
- `GET /api/admin/reports`
- `GET /api/admin/bookings`
- `PUT /api/admin/bookings/:id`

## DB + Migration

- SQL schema: `backend/mysql_schema.sql`
- Sequelize migrations: `backend/src/migrations/`

## Docker

1. Create `backend/.env`
2. `docker compose up --build`

## Production Notes

- Replace local image storage with S3/Cloudinary
- Use Google Identity Services button in frontend if needed
- Add test automation and CI/CD
