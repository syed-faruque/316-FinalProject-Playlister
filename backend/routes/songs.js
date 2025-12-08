/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import express from 'express';
import Song from '../models/Song.js';
import Playlist from '../models/Playlist.js';

const router = express.Router();

// Middleware to check if a request is coming from an authenticated user
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Route to get all songs that match a search query
router.get('/', async (req, res) => {

});

// Route to get single song by ID
router.get('/:id', async (req, res) => {

});

// Route to add a song to the catalog
router.post('/', requireAuth, async (req, res) => {

});

// Route to update a song
router.put('/:id', requireAuth, async (req, res) => {

});

// Route to remove a song from the catalog
router.delete('/:id', requireAuth, async (req, res) => {

});

// Route to update the listen count for a song
router.post('/:id/listen', async (req, res) => {

});

export default router;