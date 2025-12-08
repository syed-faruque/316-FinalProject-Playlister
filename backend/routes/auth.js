/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Route to add a new user to the system
router.post('/register', async (req, res) => {

});

// Route to check if the users login credentials are correct
router.post('/login', async (req, res) => {

});

// Route to logout the user
router.post('/logout', (req, res) => {

});

// Route that checks if the current session is active
router.get('/session', (req, res) => {

});

export default router;