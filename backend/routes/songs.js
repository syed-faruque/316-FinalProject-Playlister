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
    try {
        // extract properties from request body
        const { title, artist, year } = req.query;

        // this query object will be generated based off the request params
        const query = {};

        // add properites to the query based off the request param values passed in
        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }
        if (artist) {
            query.artist = { $regex: artist, $options: 'i' };
        }
        if (year) {
            query.year = parseInt(year);
        }

        // find the songs that match with the query
        const songs = await Song.find(query)
            .populate('owner', 'userName avatar')
            .lean();

        // Calculate playlists count for each song and store all in an array
        const songsWithCounts = await Promise.all(
            songs.map(async (song) => {
                const playlistsCount = await Playlist.countDocuments({
                    'songs.song': song._id
                });
                return {
                    ...song,
                    playlistsCount
                };
            })
        );

        // return the query result
        res.json(songsWithCounts);
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to get single song by ID
router.get('/:id', async (req, res) => {
    try {
        // find the song based off the id specified in the request
        const song = await Song.findById(req.params.id)
            .populate('owner', 'userName avatar')
            .lean();

        // if the song doesn't exist, return an error
        if (!song) {
            return res.status(404).json({ error: 'Not found' });
        }

        // add information pertaining to how many playlists contain this song
        const playlistsCount = await Playlist.countDocuments({
            'songs.song': song._id
        });

        // return the song with the playlists count as an object back to the clientside
        res.json({ ...song, playlistsCount });
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to add a song to the catalog
router.post('/', requireAuth, async (req, res) => {
    try {
        // extracts properties from request body
        const { title, artist, year, youtubeId, duration } = req.body;

        // checks if the user's song input is even valid
        if (!title || !artist || !year || !youtubeId) {
            return res.status(400).json({ error: 'Invalid input' });
        }

        // Check if song already exists
        const existingSong = await Song.findOne({ title, artist, year });
        if (existingSong) {
            return res.status(400).json({ error: 'Song exists' });
        }

        // create a new song and then save it to the database
        const song = new Song({
            title: title.trim(),
            artist: artist.trim(),
            year: parseInt(year),
            youtubeId: youtubeId.trim(),
            duration: duration || '',
            owner: req.session.userId
        });
        await song.save();

        // populate the song with more details pertaining to the user and return this data to the clientside
        await song.populate('owner', 'userName avatar');
        res.status(201).json(song);
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to update a song
router.put('/:id', requireAuth, async (req, res) => {
    try {
        // finds the song specified in the song id in the request
        const song = await Song.findById(req.params.id);

        // if the song doesn't exist, return an error
        if (!song) {
            return res.status(404).json({ error: 'Not found' });
        }

        // extract more properies from the request body
        const { title, artist, year, youtubeId, duration } = req.body;

        // remove weird spacing from the user's inputted values and update the song's fields in the database
        if (title) song.title = title.trim();
        if (artist) song.artist = artist.trim();
        if (year) song.year = parseInt(year);
        if (youtubeId) song.youtubeId = youtubeId.trim();
        if (duration !== undefined) song.duration = duration;
        await song.save();

        // populate the song with owner related data and send this back to the clientside
        await song.populate('owner', 'userName avatar');
        res.json(song);
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to remove a song from the catalog
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        // find the song specified in the song id in the request
        const song = await Song.findById(req.params.id);

        // if the song doesn't exist, return an error
        if (!song) {
            return res.status(404).json({ error: 'Not found' });
        }

        // remove song from all the playlists that its in
        await Playlist.updateMany(
            { 'songs.song': song._id },
            { $pull: { songs: { song: song._id } } }
        );

        // remove the song from the database completely
        await Song.findByIdAndDelete(req.params.id);

        // return a result to the client
        res.json({});
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to update the listen count for a song
router.post('/:id/listen', async (req, res) => {
    try {
        // find the song based off the id in the request and increment its listens value by 1
        const song = await Song.findByIdAndUpdate(
            req.params.id,
            { $inc: { listens: 1 } },
            { new: true }
        );

        // if the song doesn't exist, return an error
        if (!song) {
            return res.status(404).json({ error: 'Not found' });
        }

        // return the song data
        res.json(song);
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;