/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Middleware to check if a request is coming from an authenticated user
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Route to get the information of the current user
router.get('/me', requireAuth, async (req, res) => {
    try {
        // finds the user specified in the user id in the request and extracts password detail
        const user = await User.findById(req.session.userId).select('-password');

        // if the user wasn't found, return an error
        if (!user) {
            return res.status(404).json({ error: 'Not found' });
        }

        // return the user's data to the clientside
        res.json(user);
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to update the current user's account
router.put('/me', requireAuth, async (req, res) => {
    try {
        // extract properties from request body
        const { userName, password, passwordConfirm, avatar } = req.body;

        // find the user specified in the user id in the request in the database
        const user = await User.findById(req.session.userId);

        // if the user doesn't exist, return an error
        if (!user) {
            return res.status(404).json({ error: 'Not found' });
        }

        // if the username was provided, update it
        if (userName !== undefined) {
            if (userName.trim().length === 0) {
                return res.status(400).json({ error: 'Invalid input' });
            }
            user.userName = userName.trim();
        }

        // if the password was provided, update it
        if (password || passwordConfirm) {
            // the below checks ensure the password inputs are valid
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
            user.avatar = avatar;
        }

        await user.save();

        // Update session
        req.session.userName = user.userName;

        const userResponse = {
            _id: user._id,
            email: user.email,
            userName: user.userName,
            avatar: user.avatar
        };

        res.json({ user: userResponse });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;