Restaurant Ordering System
A full-stack restaurant ordering web app built with Node.js, Express and PostgreSQL. Customers can browse the menu, manage a cart, get automatic discounts, check out and leave feedback on products. Admins get a dashboard to oversee orders, products and discounts.

All source code lives in the restaurant_ordering_system_student/ folder.

Features
Customers

Register, log in and log out with hashed passwords (bcryptjs) and session-based authentication
Browse the product catalogue and view product details
Shopping cart: add, update and remove items, with backend validation (product availability, quantity limits) and a live cart summary
Checkout: review available and unavailable items, see the discount breakdown, and confirm a delivery address before placing an order
Feedback: create, view, edit and delete feedback on products
Admins

Role-based access control (ADMIN and customer roles) enforced by route guards
Dashboard with a filterable, sortable view of orders (by date range, category and sort order)
Product management, including setting product availability
Create, update and delete discounts
Respond to customer feedback
Discounts and ordering

Three discount types: product quantity, cart total and delivery (tiered or free delivery)
Each discount is either a percentage or a fixed amount, so new rules can be added without schema changes
Order placement runs through a PostgreSQL stored procedure (place_orders) that turns cart items into a sale order. Unavailable or failing items are skipped without rolling back items already processed.
Tech Stack
Area	Technology
Runtime and framework	Node.js, Express
Database	PostgreSQL (pg for raw queries, Prisma ORM for cart, checkout and discounts)
Auth and security	express-session, bcryptjs, role-based middleware
Frontend	HTML5, CSS3, Bootstrap 5, JavaScript
Tooling	nodemon, Prisma Migrate
Architecture	MVC (routes, controllers, models, views)
Project Structure
restaurant_ordering_system_student/
├── server.js                         # App entry point and route mounting
├── config/database.js                # PostgreSQL connection pool
├── middleware/auth.js                # Authentication and role guards
├── routes/                           # Express routers (auth, products, cart, discounts, feedback, ...)
├── controllers/                      # Request handlers
├── models/                           # Data access and business logic
├── views/                            # HTML pages
├── public/                           # CSS and client-side JavaScript
├── prisma/                           # Prisma schema and migrations
├── database/restaurant_db_restore.sql      # Schema and seed data
└── functions_&_stored_procedures.sql       # place_orders stored procedure and DB functions

Database Design
The Prisma schema extends the base restaurant database with four models:

Cart / CartItem: each member has one active cart, and each product appears at most once per cart with a quantity.
Discount: supports PRODUCT_QUANTITY, CART_TOTAL and DELIVERY types, with PERCENTAGE or FIXED_AMOUNT values.
SaleDiscount: records which discounts were applied to which orders, using a composite primary key to prevent duplicates.
Getting Started
Prerequisites: Node.js 16+ and PostgreSQL 13+

Install dependencies


cd restaurant_ordering_system_student
npm install
Create the database and restore the schema and data


createdb -U postgres restaurant_db
psql -U postgres -d restaurant_db -f database/restaurant_db_restore.sql
psql -U postgres -d restaurant_db -f "functions_&_stored_procedures.sql"
Configure environment variables by creating a .env file in restaurant_ordering_system_student/


PORT=3000
SESSION_SECRET=your-secret-key
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_NAME=restaurant_db
DB_PORT=5432
DATABASE_URL="postgresql://postgres:your-db-password@localhost:5432/restaurant_db?schema=public"
NODE_ENV=development
Generate the Prisma client


npx prisma generate
Run the app


npm run dev     # development with auto-restart
npm start       # production
Then open http://localhost:3000/login

Key API Routes
Area	Routes
Auth	POST /login, POST /register, GET /logout, GET /auth/status
Products	GET /products, GET /products/:id, PUT /products/:id, PUT /products/:id/availability
Cart and checkout	GET/POST /cart, PUT/DELETE /cart/:id, GET /cart/summary, GET/POST /cart/checkout
Discounts (admin to modify)	GET /discounts, POST /discounts, PUT/DELETE /discounts/:id
Feedback	GET/POST /feedback, GET /feedback/product/:id, PUT/DELETE /feedback/:id
Responses	GET /response, POST /response/:id, DELETE /response/:id
Admin dashboard	GET /dashboard, GET /dashboard/api
What I Learned
Designing a relational schema with Prisma migrations and moving transactional logic into a PostgreSQL stored procedure
Structuring an Express app with MVC and role-based route guards
Building flexible discount rules that are stored in the database rather than hard-coded
