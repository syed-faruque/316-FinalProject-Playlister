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

// Helper function to populate playlist with owner and song details
async function populatePlaylist(playlist) {
  await playlist.populate('owner', 'userName avatar email');
  await playlist.populate({
    path: 'songs.song',
    model: 'Song',
    options: { strictPopulate: false }
  });
}

// Helper function to filter out null songs and sort by order
function cleanAndSortSongs(playlist) {
  if (playlist.songs && Array.isArray(playlist.songs)) {
    playlist.songs = playlist.songs.filter(
      songItem => songItem.song !== null && songItem.song !== undefined
    );
    playlist.songs.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}

// Helper function to add playlist count to each song
async function addPlaylistCountsToSongs(playlist) {
  if (playlist.songs && Array.isArray(playlist.songs)) {
    for (const songItem of playlist.songs) {
      if (songItem.song) {
        const playlistsCount = await Playlist.countDocuments({
          'songs.song': songItem.song._id
        });
        songItem.song.playlistsCount = playlistsCount;
      }
    }
  }
}

// Helper function to calculate unique listener count
function getUniqueListenerCount(playlist) {
  const uniqueListeners = new Set();
  if (playlist.listeners && Array.isArray(playlist.listeners)) {
    playlist.listeners.forEach(l => {
      if (l && l.user) {
        uniqueListeners.add(l.user.toString());
      }
    });
  }
  return uniqueListeners.size;
}

// Helper function to generate untitled playlist names
async function generateUntitledName(userId) {
  const existingPlaylists = await Playlist.find({
    owner: userId,
    name: { $regex: /^Untitled \d+$/ }
  });
  let counter = 0;
  const usedNumbers = existingPlaylists
    .map(p => parseInt(p.name.match(/\d+/)?.[0] || '0'))
    .sort((a, b) => b - a);
  if (usedNumbers.length > 0) {
    counter = usedNumbers[0] + 1;
  }
  return `Untitled ${counter}`;
}

// Helper function to apply ordering to songs
function applySongOrdering(songs) {
  return songs.map((song, index) => ({
    song: song.song || song,
    order: index
  }));
}

// Route to get all playlists that match a query
router.get('/', async (req, res) => {
    try {

        // extract properties from request body
        const { playlistName, userName, songTitle, songArtist, songYear, ownerOnly } = req.query;

        // this query will be generated using filters
        let query = {};

        // filter by username
        if (userName) {
            const User = (await import('../models/User.js')).default;
            const users = await User.find({ 
                userName: { $regex: userName, $options: 'i' } 
            });
            const userIds = users.map(u => u._id);
            if (userIds.length > 0) {
                query.owner = { $in: userIds };
            } 
            else {
                query.owner = { $in: [] };
            }
        } 
        else if (ownerOnly === 'true' && req.session.userId) {
            query.owner = req.session.userId;
        }


        // Filter by playlist name
        if (playlistName) {
            query.name = { $regex: playlistName, $options: 'i' };
        }

        // Filter by song title, artist, or year
        if (songTitle || songArtist || songYear) {
            const songQuery = {};
            if (songTitle) {
                songQuery.title = { $regex: songTitle, $options: 'i' };
            }
            if (songArtist) {
                songQuery.artist = { $regex: songArtist, $options: 'i' };
            }
            if (songYear) {
                songQuery.year = parseInt(songYear);
            }
            const matchingSongs = await Song.find(songQuery).select('_id');
            const songIds = matchingSongs.map(s => s._id);
            
            if (songIds.length > 0) {
                query['songs.song'] = { $in: songIds };
            } 
            else {
                query['songs.song'] = { $in: [] };
            }
        }

        // Finds the playlists in the database based on the query and populate it with the owner details and song details
        const playlists = await Playlist.find(query)
            .populate('owner', 'userName avatar email')
            .populate({
                path: 'songs.song',
                model: 'Song',
                options: { strictPopulate: false }
            })
            .lean();

        // for each of the playlists, filter out any null songs and sort the songs based on their order
        playlists.forEach(cleanAndSortSongs);

        // for each playlist we want to store data related to the number of unique listeners
        // we will store the final array inside playlistsWithCounts
        const playlistsWithCounts = playlists.map(playlist => ({
            ...playlist,
            uniqueListenerCount: getUniqueListenerCount(playlist)
        }));

        // return the queried results to the client
        res.json(playlistsWithCounts);
    } 
    
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to get a single playlist by ID
router.get('/:id', async (req, res) => {
    try {
        // Finds the playlists in the database based on the query and populate it with the owner details and song details
        const playlist = await Playlist.findById(req.params.id)
            .populate('owner', 'userName avatar email')
            .populate({
                path: 'songs.song',
                model: 'Song',
                options: { strictPopulate: false }
            })
            .lean();

        // if the playlist isnt found return an error
        if (!playlist) {
            return res.status(404).json({ error: 'Not found' });
        }

        //  filter out any null songs and sort the songs based on their order
        cleanAndSortSongs(playlist);
        
        // loops through the songs and adds a property to each showcasing how many playlists the song is in
        await addPlaylistCountsToSongs(playlist);

        // send back the playlist data to the client
        res.json({
            ...playlist,
            uniqueListenerCount: getUniqueListenerCount(playlist)
        });
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to create a new playlist
router.post('/', requireAuth, async (req, res) => {
    try {

        // extract properties from request body
        const { name } = req.body;

        // finds how many untitled playlists were made, and initializes the name of the new playlist to Untitled with that counter
        let playlistName = name;
        if (!playlistName) {
            playlistName = await generateUntitledName(req.session.userId);
        }


        // checks to see if a playlist already exists with that name
        const existingPlaylist = await Playlist.findOne({ 
            name: playlistName,
            owner: req.session.userId 
        });


        // if it exists return an error
        if (existingPlaylist) {
            return res.status(400).json({ error: 'Name exists' });
        }

        // create a new playlist in the database and populate it with user data
        const playlist = new Playlist({
            name: playlistName,
            owner: req.session.userId,
            songs: []
        });
        await playlist.save();
        await populatePlaylist(playlist);

        // send the created playlist back the client
        res.status(201).json(playlist);
    } 

    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to update a playlist
router.put('/:id', requireAuth, async (req, res) => {
    try {
        // finds the playlist specified in the request
        const playlist = await Playlist.findById(req.params.id);

        // if the playlist doesn't exist, return an error
        if (!playlist) {
            return res.status(404).json({ error: 'Not found' });
        }

        // extracts remaining properties from request body
        const { name, songs } = req.body;

        // if the user changed the name, update the name in the database
        if (name && name !== playlist.name) {
            const existingPlaylist = await Playlist.findOne({ 
                name: name,
                owner: req.session.userId,
                _id: { $ne: playlist._id }
            });

            if (existingPlaylist) {
                return res.status(400).json({ error: 'Name exists' });
            }

            playlist.name = name;
        }

        // update the songs
        if (songs && Array.isArray(songs)) {
            playlist.songs = applySongOrdering(songs);
        }

        // save changes and populate the playlist with user and song data
        await playlist.save();
        await populatePlaylist(playlist);

        // order the songs and add information regarding its playlist count to it
        cleanAndSortSongs(playlist);
        await addPlaylistCountsToSongs(playlist);

        // send back the updated playlist to the client
        res.json(playlist);
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to copy a playlist
router.post('/:id/copy', requireAuth, async (req, res) => {
    try {
        // finds the playlist specified in the request
        const originalPlaylist = await Playlist.findById(req.params.id)
            .populate({
                path: 'songs.song',
                model: 'Song',
                options: { strictPopulate: false }
            });

        // if the playlist is not found, return an error
        if (!originalPlaylist) {
            return res.status(404).json({ error: 'Not found' });
        }

        // create a new playlist with the same details as the original
        const newPlaylist = new Playlist({
            name: originalPlaylist.name,
            owner: req.session.userId,
            songs: originalPlaylist.songs.map((item, index) => ({
                song: item.song._id || item.song,
                order: index
            }))
        });

        // counts how many names with playlist copy there are and appends this to the new name
        let counter = 1;
        let playlistName = newPlaylist.name;
        while (await Playlist.findOne({ name: playlistName, owner: req.session.userId })) {
            playlistName = `${newPlaylist.name} (${counter})`;
            counter++;
        }
        newPlaylist.name = playlistName;

        // saves the new playlist to the database and populates it and returns it to the client
        await newPlaylist.save();
        await populatePlaylist(newPlaylist);

        cleanAndSortSongs(newPlaylist);
        
        res.status(201).json(newPlaylist);
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to delete a playlist
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        // finds the playlist specified in the request
        const playlist = await Playlist.findById(req.params.id);

        // if the playlist isn't found, return an error
        if (!playlist) {
            return res.status(404).json({ error: 'Not found' });
        }

        // delete the playlist from the database
        await Playlist.findByIdAndDelete(req.params.id);

        // send back a response to the client
        res.json({});
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to record if a playlist is played
router.post('/:id/play', async (req, res) => {
    try {
        // find the playlist specified in the request
        const playlist = await Playlist.findById(req.params.id);

        // if the playlist doesn't exist, return an error
        if (!playlist) {
            return res.status(404).json({ error: 'Not found' });
        }

        // add the current user's info as listener entry and push it to the playlist's listeners array
        if (req.session.userId) {
            const listenerEntry = {
                user: req.session.userId,
                timestamp: new Date()
            };
            playlist.listeners.push(listenerEntry);
            await playlist.save();
        }

        // populate the playlist
        await populatePlaylist(playlist);

        // sorts the songs inside the playlist and adds information about the number of playlists it is in
        cleanAndSortSongs(playlist);
        await addPlaylistCountsToSongs(playlist);

        // return all playlist data back to the client
        res.json({
            ...playlist.toObject(),
            uniqueListenerCount: getUniqueListenerCount(playlist)
        });
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;