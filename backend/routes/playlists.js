/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import express from 'express';
import Playlist from '../models/Playlist.js';
import Song from '../models/Song.js';

const router = express.Router();

// Middleware to check if a request is coming from an authenticated user
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Route to get all playlists that match a query
router.get('/', async (req, res) => {

});

// Route to get a single playlist by ID
router.get('/:id', async (req, res) => {

});

// Route to create a new playlist
router.post('/', requireAuth, async (req, res) => {

});

// Route to update a playlist
router.put('/:id', requireAuth, async (req, res) => {
  
});

// Route to copy a playlist
router.post('/:id/copy', requireAuth, async (req, res) => {

});

// Route to delete a playlist
router.delete('/:id', requireAuth, async (req, res) => {
  
});

// Route to record if a playlist is played
router.post('/:id/play', async (req, res) => {

});

export default router;
