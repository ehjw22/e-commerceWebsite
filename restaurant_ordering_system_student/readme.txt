# Restaurant Ordering System

A full-stack restaurant ordering system built with Node.js, Express, and PostgreSQL. It provides separate customer and admin experiences: customers can browse products, place orders, and leave feedback, while admins get a dashboard for order and product oversight.

## Features

- **Authentication** — session-based login/registration with hashed passwords (bcryptjs)
- **Role-based access control** — `ADMIN` and `USER` roles with dedicated route guards
- **Product catalog** — browse products and view product details
- **Ordering** — place orders with automatic total calculation and transaction-safe order creation
- **Feedback system** — customers can create, view, edit, and delete feedback on products; admins/staff can respond
- **Admin dashboard** — filterable, sortable view of orders (by date range, category, sort order)

## Tech Stack

Runtime Environment: Node.js

Web Framework: Express.js 4

Database: PostgreSQL (`pg`)

Authentication & Security: express-session, bcryptjs

File Uploads: multer

Frontend: HTML5, CSS3, Bootstrap 5, JavaScript

Development Tools: nodemon

Architecture: Model-View-Controller (MVC)

## Project Structure

```
.
├── server.js                          # App entry point, route mounting
├── config/
│   └── database.js                    # PostgreSQL connection pool
├── middleware/
│   └── auth.js                        # ensureAuthenticated, ensureAdmin, ensureCustomer, redirectIfAuthenticated
├── routes/
│   ├── auth.js                        # /login, /register, /logout
│   ├── dashboard.js                   # /dashboard (admin)
│   ├── products.js                    # /products (catalog, purchase)
│   ├── productsPage.js                # /member/products, /member/product-detail
│   ├── feedback.js                    # /feedback (CRUD, JSON API)
│   ├── feedbackPage.js                # /member/feedback (HTML pages)
│   ├── responses.js                   # /response (feedback responses)
│   └── api.js                         # /api (misc/legacy dashboard API)
├── controllers/
│   ├── authController.js
│   ├── dashboardController.js
│   ├── productFeedbackController.js
│   └── responsesController.js
├── models/
│   ├── Member.js
│   ├── Product.js
│   ├── SaleOrder.js
│   ├── productFeedbackModel.js
│   └── responsesModel.js
├── views/                             # Static HTML pages (login, register, dashboard, products, feedback)
├── public/
│   ├── css/                           # Stylesheets
│   └── js/                            # Client-side scripts
├── database/
│   └── restaurant_db_restore.sql      # Full DB schema + seed/restore dump
├── functions_&_stored_procedures.sql  # Additional SQL functions/procedures
├── package.json
└── package-lock.json
```

## Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [PostgreSQL](https://www.postgresql.org/) (v13+ recommended)

## Setup

1. **Clone/extract the project and install dependencies**

   ```bash
   npm install
   ```

2. **Create the database**

   Create a PostgreSQL database and restore it from the provided dump: functions_&_stored_procedures.sql

3. **Configure environment variables**

   Create a `.env` file in the project root:

   ```env
   PORT=3000
   SESSION_SECRET=your-secret-key

   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=your-db-password
   DB_NAME=restaurant_db
   DB_PORT=5432

   NODE_ENV=development
   ```

4. **Run the app**

   ```bash
   # Development (auto-restart on changes)
   npm run dev

   # Production
   npm start
   ```

   The server starts on `http://localhost:3000/login` (or your configured `PORT`).


##Key Routes

Auth (routes/auth.js, mounted at /)
GET /login — serve the login page
POST /login — authenticate and create a session
GET /register — serve the registration page
POST /register — create a member account and session
GET /logout — destroy the session
GET /auth/status — check whether the current session is authenticated


Dashboard (routes/dashboard.js, mounted at /dashboard) — Admin only
GET /dashboard — serve the admin dashboard page
GET /dashboard/api — fetch data for the dashboard view


Products (routes/products.js, mounted at /products)
GET /products — retrieve all products (member view)
GET /products/memberOrder — retrieve the current member's ordered products
GET /products/:id — retrieve a single product by ID
POST /products/purchase — place an order for one or more products


Product Pages (routes/productsPage.js, mounted at /member) — Authenticated
GET /member/products — serve the product catalog page
GET /member/product-detail — serve the product detail page


Feedback (routes/feedback.js, mounted at /feedback)
GET /feedback — fetch all feedback submitted by the authenticated member (Authenticated)
GET /feedback/:id — retrieve a single feedback submission by ID
GET /feedback/product/:id — fetch all feedback left for a specific product
POST /feedback — submit new feedback (Authenticated)
PUT /feedback/:id — update an existing feedback entry (Authenticated)
DELETE /feedback/:id — remove a feedback entry (Authenticated)


Feedback Pages (routes/feedbackPage.js, mounted at /member) - Authenticated
GET /member/feedback — serve the feedback dashboard overview page
GET /member/feedback/edit — serve the edit-feedback form page
GET /member/feedback/create — serve the create-feedback form page


Responses (routes/responses.js, mounted at /response)
GET /response — fetch all responses belonging to the authenticated user (Authenticated)
POST /response/:id — create a new response linked to a specific item ID
DELETE /response/:id — remove a response by ID

## Authentication & Roles

Session data (`req.session.userId`, `req.session.userRole`, `req.session.userName`) is set on login/registration. Route access is controlled via middleware in `middleware/auth.js`:

- `ensureAuthenticated`: requires any logged-in session
- `ensureAdmin`: requires `role === 'ADMIN'`
- `ensureCustomer`: requires `role === 'customer'`
- `redirectIfAuthenticated`: redirects already-logged-in users away from public pages (e.g. login)