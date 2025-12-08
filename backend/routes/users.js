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

});

// Route to update the current user's account
router.put('/me', requireAuth, async (req, res) => {

});

export default router;