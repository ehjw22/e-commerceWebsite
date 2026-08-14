Restaurant Ordering System

A full-stack restaurant ordering system built with Node.js, Express, and PostgreSQL. It provides separate customer and admin experiences: customers can browse products, manage a shopping cart, apply discounts, checkout, place orders, and leave feedback, while admins get a dashboard for order and product oversight.

Features
Authentication - session-based login/registration with hashed passwords (bcryptjs)
Role-based access control - ADMIN and USER roles with dedicated route guards
Product catalog - browse products and view product details
Shopping cart - add, update, and remove cart items via Prisma ORM, with backend-enforced validation (product availability, quantity limits) and a live cart summary
Checkout & discounts - review available/unavailable cart items, apply product-quantity and cart-total discounts plus tiered/free delivery, and confirm a delivery address before placing an order
Transaction-safe order placement - a PostgreSQL stored procedure (place_orders) converts cart items into a sale order; unavailable or failing items are skipped without rolling back items that were already processed
Ordering - place orders with automatic total calculation and transaction-safe order creation
Feedback system - customers can create, view, edit, and delete feedback on products; admins/staff can respond
Admin dashboard - filterable, sortable view of orders (by date range, category, sort order)
Tech Stack

Runtime Environment: Node.js

Web Framework: Express.js 4

Database: PostgreSQL (pg, plus Prisma ORM for cart/checkout/discount features)

ORM: Prisma

Authentication & Security: express-session, bcryptjs

Frontend: HTML5, CSS3, Bootstrap 5, JavaScript

Development Tools: nodemon

Architecture: Model-View-Controller (MVC)

Databases

This project uses two PostgreSQL databases:

restaurant - the main application database (members, products, cart, sale orders, discounts, feedback). Accessed via a mix of raw pg queries and Prisma ORM.
Project Structure
.
├── server.js                          # App entry point, route mounting
├── config/
│   └── database.js                    # PostgreSQL connection pool
├── middleware/
│   └── auth.js                        # ensureAuthenticated, ensureAdmin, ensureCustomer, redirectIfAuthenticated
├── prisma/
│   └── schema.prisma                  # Prisma schema (Cart, CartItem, Discount, SaleDiscount + existing models)
├── routes/
│   ├── auth.js                        # /login, /register, /logout
│   ├── dashboard.js                   # /dashboard (admin)
│   ├── products.js                    # /products (catalog, purchase)
│   ├── productsPage.js                # /member/products, /member/product-detail
│   ├── feedback.js                    # /feedback (CRUD, JSON API)
│   ├── feedbackPage.js                # /member/feedback (HTML pages)
│   ├── responses.js                   # /response (feedback responses)
│   ├── cart.js                        # /cart (cart CRUD, summary, checkout)
│   └── api.js                         # /api (misc/legacy dashboard API)
├── controllers/
│   ├── authController.js
│   ├── dashboardController.js
│   ├── productFeedbackController.js
│   ├── responsesController.js
│   └── cartController.js              # Handles cart & checkout HTTP requests
│   └── discountController.js              
├── models/
│   ├── Member.js
│   ├── Product.js
│   ├── SaleOrder.js
│   ├── productFeedbackModel.js
│   ├── responsesModel.js
│   ├── cartModel.js                   # Cart CRUD, checkout summary, order placement (via Prisma + stored procedure)
│   └── discountModel.js               # Discount calculation logic (product/cart/delivery)
├── views/                             # Static HTML pages (login, register, dashboard, products, feedback, cart, checkout)
├── public/
│   ├── css/                           # Stylesheets
│   └── js/
│       ├── cartIndex.js               # Cart page frontend logic
│       └── cartCheckout.js            # Checkout page frontend logic
│       └── discounts.js               # Discount page frontend logic
├── database/
│   └── restaurant_db_restore.sql      # Full DB schema + seed/restore dump
├── functions_&_stored_procedures.sql  # place_orders stored procedure and other DB functions
├── package.json
└── package-lock.json

Prerequisites
Node.js (v16+ recommended)
PostgreSQL (v13+ recommended)
Setup
Clone/extract the project and install dependencies

npm install

Create the databases Create the two PostgreSQL databases used by this project:
restaurant - restore from database/restaurant_db_restore.sql
Then apply the stored procedures and functions:
bash
   psql -U postgres -d restaurant -f "functions_&_stored_procedures.sql"
Configure environment variables Create a .env file in the project root:
env
   PORT=3000
   SESSION_SECRET=your-secret-key

   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=your-db-password
   DB_NAME=restaurant_db
   DB_PORT=5432

   # Prisma connection string for the restaurant database
   DATABASE_URL="postgresql://postgres:your-db-password@localhost:5432/restaurant?schema=public"

   NODE_ENV=development

Note: Confirm the exact DATABASE_URL format and any additional variables against your actual .env/schema.prisma setup

Generate the Prisma client

npx prisma generate

If the Prisma schema needs to be synced to an existing database:

   npx prisma db pull      # introspect existing schema, or
   npx prisma migrate dev  # apply schema changes via migrations

Run the app

   # Development (auto-restart on changes)
   npm run dev

   # Production
   npm start

The server starts on http://localhost:3000/login (or your configured PORT).

Key Routes

Auth (routes/auth.js, mounted at /) GET /login - serve the login page POST /login - authenticate and create a session GET /register - serve the registration page POST /register - create a member account and session GET /logout - destroy the session GET /auth/status - check whether the current session is authenticated

Dashboard (routes/dashboard.js, mounted at /dashboard) - Admin only GET /dashboard - serve the admin dashboard page GET /dashboard/api - fetch data for the dashboard view

Products (routes/products.js, mounted at /products) GET /products - retrieve all products (member view) GET /products/memberOrder - retrieve the current member's ordered products GET /products/:id - retrieve a single product by ID POST /products/purchase - place an order for one or more products

Product Pages (routes/productsPage.js, mounted at /member) - Authenticated GET /member/products - serve the product catalog page GET /member/product-detail - serve the product detail page

Cart & Checkout (routes/cart.js, mounted at /cart) - Authenticated GET /cart - retrieve the member's current cart POST /cart - add a product to the cart PUT /cart/:id - update the quantity of a cart item DELETE /cart/:id - remove a product from the cart GET /cart/summary - retrieve the cart subtotal, discounts, delivery fee, and total GET /cart/checkout - retrieve checkout information (available/unavailable items, discount breakdown) POST /cart/checkout - validate and submit the order (invokes the place_orders stored procedure)

Feedback (routes/feedback.js, mounted at /feedback) GET /feedback - fetch all feedback submitted by the authenticated member (Authenticated) GET /feedback/:id - retrieve a single feedback submission by ID GET /feedback/product/:id - fetch all feedback left for a specific product POST /feedback - submit new feedback (Authenticated) PUT /feedback/:id - update an existing feedback entry (Authenticated) DELETE /feedback/:id - remove a feedback entry (Authenticated)

Feedback Pages (routes/feedbackPage.js, mounted at /member) - Authenticated GET /member/feedback - serve the feedback dashboard overview page GET /member/feedback/edit - serve the edit-feedback form page GET /member/feedback/create - serve the create-feedback form page

Responses (routes/responses.js, mounted at /response) GET /response - fetch all responses belonging to the authenticated user (Authenticated) POST /response/:id - create a new response linked to a specific item ID DELETE /response/:id - remove a response by ID

Authentication & Roles

Session data (req.session.userId, req.session.userRole, req.session.userName) is set on login/registration. Route access is controlled via middleware in middleware/auth.js:

ensureAuthenticated: requires any logged-in session
ensureAdmin: requires role === 'ADMIN'
ensureCustomer: requires role === 'customer'
redirectIfAuthenticated: redirects already-logged-in users away from public pages (e.g. login)
Database Design Notes

The restaurant database schema was extended with four new Prisma models to support cart, checkout, and discounts:

Cart / CartItem - a member's shopping cart and its contents. Each member has at most one active cart (@unique on memberId); each product can appear at most once per cart (@@unique([cartId, productId])), with quantity tracked per row.
Discount - a flexible model supporting multiple discount types (PRODUCT_QUANTITY, CART_TOTAL, DELIVERY) and value types (PERCENTAGE, FIXED_AMOUNT), allowing new discount rules to be added without schema changes.
SaleDiscount - an associative table recording which discounts were applied to which orders (many-to-many between SaleOrder and Discount), with a composite primary key (@@id([saleOrderId, discountId])) to prevent duplicate application.

Order placement is handled by the place_orders PostgreSQL stored procedure, which processes cart items individually - unavailable items are skipped without rolling back items already processed. See functions_&_stored_procedures.sql.