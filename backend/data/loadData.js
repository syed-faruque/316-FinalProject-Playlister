/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Song from '../models/Song.js';
import Playlist from '../models/Playlist.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// connects to MongoDB and ensure the database is reachable
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/playlister');
        console.log('MongoDB connected successfully');
    } 
    catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// locates and loads PlaylisterData.json from multiple possible paths
const loadData = () => {
    const possiblePaths = [
        path.join(__dirname, 'PlaylisterData.json'),
        path.join(__dirname, '../PlaylisterData.json'),
        path.join(__dirname, '../../PlaylisterData.json'),
        '/Users/syedfaruque/Documents/PlaylisterData.json'
    ];

    for (const dataPath of possiblePaths) {

        if (fs.existsSync(dataPath)) {

            console.log(`Loading data from: ${dataPath}`);
            const rawData = fs.readFileSync(dataPath, 'utf8');
            return JSON.parse(rawData);
        } 

    }

    throw new Error('PlaylisterData.json not found. Please ensure the file exists.');
};

// creates user accounts based on the loaded data
const createUsers = async (usersData) => {
    console.log(`Creating ${usersData.length} users...`);
    const userMap = new Map(); // Maps email to created user document

    for (const userData of usersData) {
        try {
            let user = await User.findOne({ email: userData.email.toLowerCase() });

            if (!user) {

                user = new User({
                    email: userData.email.toLowerCase(),
                    userName: userData.name || userData.email.split('@')[0],
                    password: 'defaultPassword123', // Default password for all users
                    avatar: ''
                });

                await user.save();
                console.log(`Created user: ${user.email}`);

            } 
            else {

                console.log(`User already exists: ${user.email}`);
            }

            userMap.set(userData.email.toLowerCase(), user);
        } 
        catch (error) {
            console.error(`Error creating user ${userData.email}:`, error.message);
        }
    }

    return userMap;
};

// creates Song documents based on playlist data
const createSongs = async (playlistsData, userMap) => {
    console.log('Creating songs from playlists...');
    const songMap = new Map(); // Maps title+artist+year -> song document
    let songsCreated = 0;
    let songsSkipped = 0;

    for (const playlist of playlistsData) {

        if (!playlist.songs || !Array.isArray(playlist.songs)) {
            continue;
        }

        for (const songData of playlist.songs) {
            try {
                const title = (songData.title || '').trim();
                const artist = (songData.artist || '').trim();
                const year = parseInt(songData.year) || 0;
                const youtubeId = (songData.youTubeId || songData.youtubeId || '').trim();

                if (!title || !artist || !year || !youtubeId) {
                    songsSkipped++;
                    continue;
                }

                const songKey = `${title.toLowerCase()}|${artist.toLowerCase()}|${year}`;

                if (!songMap.has(songKey)) {

                    let song = await Song.findOne({ title, artist, year });
                    const ownerEmail = playlist.ownerEmail?.toLowerCase();
                    let owner = ownerEmail ? userMap.get(ownerEmail) : null;

                    if (!owner && userMap.size > 0) {
                        owner = Array.from(userMap.values())[0];
                    }

                    if (!owner) {
                        console.warn(`No owner found for song: ${title} by ${artist}`);
                        songsSkipped++;
                        continue;
                    }

                    if (!song) {

                        song = new Song({
                            title,
                            artist,
                            year,
                            youtubeId,
                            duration: '',
                            listens: 0,
                            owner: owner._id
                        });

                        await song.save();
                        songsCreated++;

                        if (songsCreated % 100 === 0) {
                            console.log(`Created ${songsCreated} songs...`);
                        }

                    }

                    songMap.set(songKey, song);
                }

            } 
            catch (error) {

                if (error.code === 11000) {
                    const title = (songData.title || '').trim();
                    const artist = (songData.artist || '').trim();
                    const year = parseInt(songData.year) || 0;
                    const song = await Song.findOne({ title, artist, year });

                    if (song) {
                        const songKey = `${title.toLowerCase()}|${artist.toLowerCase()}|${year}`;
                        songMap.set(songKey, song);
                    }
                } 
                else {
                    console.error(`Error creating song ${songData.title}:`, error.message);
                }
            }
        }
    }

    console.log(`Created ${songsCreated} new songs, skipped ${songsSkipped} invalid songs`);
    return songMap;
};

// creates Playlist documents based on the loaded data
const createPlaylists = async (playlistsData, userMap, songMap) => {
    console.log(`Creating ${playlistsData.length} playlists...`);
    let playlistsCreated = 0;
    let playlistsSkipped = 0;

    for (const playlistData of playlistsData) {
        try {
            const playlistName = (playlistData.name || '').trim();
            const ownerEmail = playlistData.ownerEmail?.toLowerCase();

            if (!playlistName || !ownerEmail) {
                playlistsSkipped++;
                continue;
            }

            const owner = userMap.get(ownerEmail);

            if (!owner) {
                console.warn(`Owner not found for playlist: ${playlistName} (${ownerEmail})`);
                playlistsSkipped++;
                continue;
            }

            const existingPlaylist = await Playlist.findOne({
                name: playlistName,
                owner: owner._id
            });

            if (existingPlaylist) {
                console.log(`Playlist already exists: ${playlistName} (${ownerEmail})`);
                continue;
            }

            const songs = [];

            if (playlistData.songs && Array.isArray(playlistData.songs)) {

                for (let i = 0; i < playlistData.songs.length; i++) {
                    const songData = playlistData.songs[i];
                    const title = (songData.title || '').trim();
                    const artist = (songData.artist || '').trim();
                    const year = parseInt(songData.year) || 0;

                    if (!title || !artist || !year) {
                        continue;
                    }

                    const songKey = `${title.toLowerCase()}|${artist.toLowerCase()}|${year}`;
                    const song = songMap.get(songKey);

                    if (song) {
                        songs.push({
                            song: song._id,
                            order: i
                        });
                    }
                }
            }

            const playlist = new Playlist({
                name: playlistName,
                owner: owner._id,
                songs: songs,
                listeners: []
            });

            await playlist.save();
            playlistsCreated++;

            if (playlistsCreated % 50 === 0) {
                console.log(`Created ${playlistsCreated} playlists...`);
            }

        } 
        catch (error) {

            if (error.code === 11000) {
                console.log(`Playlist already exists: ${playlistData.name}`);
            } 
            else {
                console.error(`Error creating playlist ${playlistData.name}:`, error.message);
                playlistsSkipped++;
            }
        }
    }

    console.log(`Created ${playlistsCreated} playlists, skipped ${playlistsSkipped} playlists`);
};

// orchestrates database seeding
const main = async () => {
    try {
        await connectDB();

        console.log('Clearing existing data...');
        await Playlist.deleteMany({});
        await Song.deleteMany({});
        await User.deleteMany({});
        console.log('Database cleared successfully.');

        const data = loadData();
        console.log(`Loaded data: ${data.users?.length || 0} users, ${data.playlists?.length || 0} playlists`);

        const userMap = await createUsers(data.users || []);
        console.log(`User map created with ${userMap.size} users`);

        const songMap = await createSongs(data.playlists || [], userMap);
        console.log(`Song map created with ${songMap.size} songs`);

        await createPlaylists(data.playlists || [], userMap, songMap);

        console.log('Data loading completed successfully!');
        process.exit(0);

    } 
    catch (error) {
        console.error('Error loading data:', error);
        process.exit(1);
    }
};

main();
