const express = require('express');
const db = require('../config/database');
const path = require('path');
const router = express.Router();
const {ensureAuthenticated} = require('../middleware/auth')

router.get('/feedback', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/feedback/index.html'));
})

router.get('/feedback-edit', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/feedback/edit.html'))
})

router.get('/feedback-create', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/feedback/create.html'))
})

module.exports = router;