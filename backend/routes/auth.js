/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Route to add a new user to the system
router.post('/register', async (req, res) => {
    try {
        // extract properties from request body
        const { email, userName, password, passwordConfirm, avatar } = req.body;

        // check if the provided values are even valid
        if (!email || !userName || !password || !passwordConfirm) {
        return res.status(400).json({ error: 'Invalid input' });
        }
        if (password.length < 8) {
        return res.status(400).json({ error: 'Invalid password' });
        }
        if (password !== passwordConfirm) {
        return res.status(400).json({ error: 'Invalid password' });
        }
        if (userName.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid input' });
        }

        // check if the email already exists in the database
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
        return res.status(400).json({ error: 'Email exists' });
        }

        // create a new user and store it to the database
        const user = new User({
            email: email.toLowerCase(),
            userName: userName.trim(),
            password,
            avatar: avatar || ''
        });
        await user.save();


        // return the user's information
        const userResponse = {
            _id: user._id,
            email: user.email,
            userName: user.userName,
            avatar: user.avatar
        };
        res.status(201).json({ user: userResponse });
    }

    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }  
});

// Route to check if the users login credentials are correct
router.post('/login', async (req, res) => {
    try {
        // extract properties from request body
        const { email, password } = req.body;

        // check if the provided values are even valid
        if (!email || !password) {
            return res.status(400).json({ error: 'Invalid input' });
        }

        // find the user in the database table
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // check if the user's password matches the given password value
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // create a session for the user once he is authenticated
        req.session.userId = user._id.toString();
        req.session.userName = user.userName;
        req.session.userEmail = user.email;

        // Return user's information
        const userResponse = {
            _id: user._id,
            email: user.email,
            userName: user.userName,
            avatar: user.avatar
        };
        res.json({ user: userResponse });
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to logout the user
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }
        res.clearCookie('connect.sid');
        res.json({});
    });
});

// Route that checks if the current session is active
router.get('/session', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            authenticated: true,
            userId: req.session.userId,
            userName: req.session.userName,
            userEmail: req.session.userEmail
        });
    } 
    else {
        res.json({ authenticated: false });
    }
});

export default router;