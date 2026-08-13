const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
}));

//serve static assets only 
app.use(express.static('public'));
//Mount auth routes at the ROOT
app.use('/', require('./routes/auth'));

app.use('/dashboard', require('./routes/dashboard'));
app.use('/products', require('./routes/products'));
app.use('/member', require('./routes/productsPage'));
app.use('/member', require('./routes/feedbackPage'));
app.use('/feedback', require('./routes/feedback'));
app.use('/response', require('./routes/responses'));
app.use('/member', require('./routes/cartPage'));
app.use('/cart', require('./routes/cart'));
app.use('/discounts', require('./routes/discounts.js'));
app.use('/discount', require('./routes/discountsPage.js'));
app.use('/product-management', require('./routes/productAdminPage.js'))

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.get('/auth/status', (req, res) => {
    if (req.session && req.session.userId) {
        return res.json({
            authenticated: true,
            user: {
                id: req.session.userId,
                role: req.session.userRole,
                name: req.session.userName
            }
        });
    }

    res.json({ authenticated: false, user: null});
});
