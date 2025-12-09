/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Middleware to ensure the user is authenticated
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

// Route to get the currently logged-in user's data
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('-password'); // Exclude password from response
        if (!user) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to update the currently logged-in user's account
router.put('/me', requireAuth, async (req, res) => {
    try {
        const { userName, password, passwordConfirm, avatar } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({ error: 'Not found' });
        }

        // Update the userName if it is provided
        if (userName !== undefined) {
            if (userName.trim().length === 0) {
                return res.status(400).json({ error: 'Invalid input' });
            }
            user.userName = userName.trim();
        }

        // Update the password if it is provided
        if (password || passwordConfirm) {
            if (!password || !passwordConfirm) {
                return res.status(400).json({ error: 'Invalid input' });
            }

            if (password.length < 8) {
                return res.status(400).json({ error: 'Invalid password' });
            }

            if (password !== passwordConfirm) {
                return res.status(400).json({ error: 'Invalid password' });
            }

            user.password = password;
        }

        // Update avatar if provided
        if (avatar !== undefined) {
            user.avatar = avatar || '';
        }

        await user.save(); // Save updated user

        // Update session username
        req.session.userName = user.userName;

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

export default router;
