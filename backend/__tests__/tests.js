/**
 * Syed Faruque
 * SBU-ID: 116340094
 */


import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Song from '../models/Song.js';
import Playlist from '../models/Playlist.js';

const TEST_DB_URI = 'mongodb://localhost:27017/playlister-test';

beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(TEST_DB_URI);
});

afterAll(async () => {
    await User.deleteMany({});
    await Song.deleteMany({});
    await Playlist.deleteMany({});
    await mongoose.connection.close();
});

describe('User Model', () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });

    describe('User Creation', () => {
        it('should create a user with valid data', async () => {
            const userData = {
                email: 'test@example.com',
                userName: 'TestUser',
                password: 'password123'
            };

            const user = new User(userData);
            await user.save();

            expect(user._id).toBeDefined();
            expect(user.email).toBe('test@example.com');
            expect(user.userName).toBe('TestUser');
            expect(user.password).not.toBe('password123');
            expect(user.avatar).toBe('');
        });

        it('should hash password before saving', async () => {
            const userData = {
                email: 'test2@example.com',
                userName: 'TestUser2',
                password: 'password123'
            };

            const user = new User(userData);
            await user.save();

            expect(user.password).not.toBe('password123');
            expect(user.password.length).toBeGreaterThan(20);
        });

        it('should lowercase email', async () => {
            const userData = {
                email: 'TEST@EXAMPLE.COM',
                userName: 'TestUser',
                password: 'password123'
            };

            const user = new User(userData);
            await user.save();

            expect(user.email).toBe('test@example.com');
        });

        it('should trim userName', async () => {
            const userData = {
                email: 'test3@example.com',
                userName: '  TestUser  ',
                password: 'password123'
            };

            const user = new User(userData);
            await user.save();

            expect(user.userName).toBe('TestUser');
        });

        it('should require email', async () => {
            const user = new User({
                userName: 'TestUser',
                password: 'password123'
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require userName', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123'
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require password', async () => {
            const user = new User({
                email: 'test@example.com',
                userName: 'TestUser'
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should enforce unique email', async () => {
            const userData = {
                email: 'duplicate@example.com',
                userName: 'TestUser1',
                password: 'password123'
            };

            const user1 = new User(userData);
            await user1.save();

            const user2 = new User({
                ...userData,
                userName: 'TestUser2'
            });

            await expect(user2.save()).rejects.toThrow();
        });

        it('should enforce minimum password length', async () => {
            const user = new User({
                email: 'test4@example.com',
                userName: 'TestUser',
                password: 'short'
            });

            await expect(user.save()).rejects.toThrow();
        });
    });

    describe('Password Comparison', () => {
        it('should compare password correctly', async () => {
            const userData = {
                email: 'test5@example.com',
                userName: 'TestUser',
                password: 'password123'
            };

            const user = new User(userData);
            await user.save();

            const isMatch = await user.comparePassword('password123');
            expect(isMatch).toBe(true);

            const isNotMatch = await user.comparePassword('wrongpassword');
            expect(isNotMatch).toBe(false);
        });
    });

    describe('User Update', () => {
        it('should update userName', async () => {
            const user = new User({
                email: 'test6@example.com',
                userName: 'OldName',
                password: 'password123'
            });
            await user.save();

            user.userName = 'NewName';
            await user.save();

            const updatedUser = await User.findById(user._id);
            expect(updatedUser.userName).toBe('NewName');
        });

        it('should not rehash password if not modified', async () => {
            const user = new User({
                email: 'test7@example.com',
                userName: 'TestUser',
                password: 'password123'
            });
            await user.save();

            const originalPassword = user.password;
            user.userName = 'NewName';
            await user.save();

            expect(user.password).toBe(originalPassword);
        });

        it('should update avatar', async () => {
            const user = new User({
                email: 'test8@example.com',
                userName: 'TestUser',
                password: 'password123',
                avatar: ''
            });
            await user.save();

            user.avatar = 'base64encodedimage';
            await user.save();

            const updatedUser = await User.findById(user._id);
            expect(updatedUser.avatar).toBe('base64encodedimage');
        });
    });
});

describe('Song Model', () => {
    let testUser;

    beforeEach(async () => {
        await Song.deleteMany({});
        await User.deleteMany({});

        testUser = new User({
            email: 'songtest@example.com',
            userName: 'SongTestUser',
            password: 'password123'
        });
        await testUser.save();
    });

    describe('Song Creation', () => {
        it('should create a song with valid data', async () => {
            const songData = {
                title: 'Test Song',
                artist: 'Test Artist',
                year: 2020,
                youtubeId: 'test123',
                owner: testUser._id
            };

            const song = new Song(songData);
            await song.save();

            expect(song._id).toBeDefined();
            expect(song.title).toBe('Test Song');
            expect(song.artist).toBe('Test Artist');
            expect(song.year).toBe(2020);
            expect(song.youtubeId).toBe('test123');
            expect(song.listens).toBe(0);
            expect(song.duration).toBe('');
        });

        it('should require title', async () => {
            const song = new Song({
                artist: 'Test Artist',
                year: 2020,
                youtubeId: 'test123',
                owner: testUser._id
            });

            await expect(song.save()).rejects.toThrow();
        });

        it('should require artist', async () => {
            const song = new Song({
                title: 'Test Song',
                year: 2020,
                youtubeId: 'test123',
                owner: testUser._id
            });

            await expect(song.save()).rejects.toThrow();
        });

        it('should require year', async () => {
            const song = new Song({
                title: 'Test Song',
                artist: 'Test Artist',
                youtubeId: 'test123',
                owner: testUser._id
            });

            await expect(song.save()).rejects.toThrow();
        });

        it('should require youtubeId', async () => {
            const song = new Song({
                title: 'Test Song',
                artist: 'Test Artist',
                year: 2020,
                owner: testUser._id
            });

            await expect(song.save()).rejects.toThrow();
        });

        it('should require owner', async () => {
            const song = new Song({
                title: 'Test Song',
                artist: 'Test Artist',
                year: 2020,
                youtubeId: 'test123'
            });

            await expect(song.save()).rejects.toThrow();
        });

        it('should enforce unique title+artist+year combination', async () => {
            const songData = {
                title: 'Duplicate Song',
                artist: 'Test Artist',
                year: 2020,
                youtubeId: 'test123',
                owner: testUser._id
            };

            const song1 = new Song(songData);
            await song1.save();

            const song2 = new Song({
                ...songData,
                youtubeId: 'different123'
            });

            await expect(song2.save()).rejects.toThrow();
        });

        it('should allow same title/artist with different year', async () => {
            const song1 = new Song({
                title: 'Same Song',
                artist: 'Same Artist',
                year: 2020,
                youtubeId: 'test123',
                owner: testUser._id
            });
            await song1.save();

            const song2 = new Song({
                title: 'Same Song',
                artist: 'Same Artist',
                year: 2021,
                youtubeId: 'test456',
                owner: testUser._id
            });

            await expect(song2.save()).resolves.toBeDefined();
        });

        it('should trim title and artist', async () => {
            const song = new Song({
                title: '  Test Song  ',
                artist: '  Test Artist  ',
                year: 2020,
                youtubeId: 'test123',
                owner: testUser._id
            });
            await song.save();

            expect(song.title).toBe('Test Song');
            expect(song.artist).toBe('Test Artist');
        });
    });

    describe('Song Update', () => {
        it('should update song properties', async () => {
            const song = new Song({
                title: 'Original Title',
                artist: 'Original Artist',
                year: 2020,
                youtubeId: 'original123',
                owner: testUser._id
            });
            await song.save();

            song.title = 'Updated Title';
            song.artist = 'Updated Artist';
            song.year = 2021;
            song.youtubeId = 'updated123';
            song.duration = '3:45';
            await song.save();

            const updatedSong = await Song.findById(song._id);
            expect(updatedSong.title).toBe('Updated Title');
            expect(updatedSong.artist).toBe('Updated Artist');
            expect(updatedSong.year).toBe(2021);
            expect(updatedSong.youtubeId).toBe('updated123');
            expect(updatedSong.duration).toBe('3:45');
        });

        it('should increment listens', async () => {
            const song = new Song({
                title: 'Listen Test',
                artist: 'Test Artist',
                year: 2020,
                youtubeId: 'test123',
                owner: testUser._id
            });
            await song.save();

            song.listens = 5;
            await song.save();

            const updatedSong = await Song.findById(song._id);
            expect(updatedSong.listens).toBe(5);
        });
    });
});

describe('Playlist Model', () => {
    let testUser;
    let testSong1;
    let testSong2;

    beforeEach(async () => {
        await Playlist.deleteMany({});
        await Song.deleteMany({});
        await User.deleteMany({});

        testUser = new User({
            email: 'playlisttest@example.com',
            userName: 'PlaylistTestUser',
            password: 'password123'
        });
        await testUser.save();

        testSong1 = new Song({
            title: 'Song 1',
            artist: 'Artist 1',
            year: 2020,
            youtubeId: 'song1',
            owner: testUser._id
        });
        await testSong1.save();

        testSong2 = new Song({
            title: 'Song 2',
            artist: 'Artist 2',
            year: 2021,
            youtubeId: 'song2',
            owner: testUser._id
        });
        await testSong2.save();
    });

    describe('Playlist Creation', () => {
        it('should create a playlist with valid data', async () => {
            const playlistData = {
                name: 'Test Playlist',
                owner: testUser._id,
                songs: [
                    { song: testSong1._id, order: 0 },
                    { song: testSong2._id, order: 1 }
                ],
                listeners: []
            };

            const playlist = new Playlist(playlistData);
            await playlist.save();

            expect(playlist._id).toBeDefined();
            expect(playlist.name).toBe('Test Playlist');
            expect(playlist.owner.toString()).toBe(testUser._id.toString());
            expect(playlist.songs).toHaveLength(2);
            expect(playlist.songs[0].order).toBe(0);
            expect(playlist.songs[1].order).toBe(1);
        });

        it('should require name', async () => {
            const playlist = new Playlist({
                owner: testUser._id,
                songs: []
            });

            await expect(playlist.save()).rejects.toThrow();
        });

        it('should require owner', async () => {
            const playlist = new Playlist({
                name: 'Test Playlist',
                songs: []
            });

            await expect(playlist.save()).rejects.toThrow();
        });

        it('should enforce unique playlist name per user', async () => {
            const playlist1 = new Playlist({
                name: 'Unique Playlist',
                owner: testUser._id,
                songs: []
            });
            await playlist1.save();

            const playlist2 = new Playlist({
                name: 'Unique Playlist',
                owner: testUser._id,
                songs: []
            });

            await expect(playlist2.save()).rejects.toThrow();
        });

        it('should allow same playlist name for different users', async () => {
            const user2 = new User({
                email: 'user2@example.com',
                userName: 'User2',
                password: 'password123'
            });
            await user2.save();

            const playlist1 = new Playlist({
                name: 'Same Name',
                owner: testUser._id,
                songs: []
            });
            await playlist1.save();

            const playlist2 = new Playlist({
                name: 'Same Name',
                owner: user2._id,
                songs: []
            });

            await expect(playlist2.save()).resolves.toBeDefined();
        });

        it('should handle empty songs array', async () => {
            const playlist = new Playlist({
                name: 'Empty Playlist',
                owner: testUser._id,
                songs: []
            });
            await playlist.save();

            expect(playlist.songs).toHaveLength(0);
        });

        it('should maintain song order', async () => {
            const playlist = new Playlist({
                name: 'Ordered Playlist',
                owner: testUser._id,
                songs: [
                    { song: testSong2._id, order: 1 },
                    { song: testSong1._id, order: 0 }
                ]
            });
            await playlist.save();

            expect(playlist.songs[0].order).toBe(1);
            expect(playlist.songs[1].order).toBe(0);
        });
    });

    describe('Playlist Update', () => {
        it('should update playlist name', async () => {
            const playlist = new Playlist({
                name: 'Original Name',
                owner: testUser._id,
                songs: []
            });
            await playlist.save();

            playlist.name = 'Updated Name';
            await playlist.save();

            const updatedPlaylist = await Playlist.findById(playlist._id);
            expect(updatedPlaylist.name).toBe('Updated Name');
        });

        it('should update songs array', async () => {
            const playlist = new Playlist({
                name: 'Update Songs',
                owner: testUser._id,
                songs: [{ song: testSong1._id, order: 0 }]
            });
            await playlist.save();

            playlist.songs = [
                { song: testSong2._id, order: 0 },
                { song: testSong1._id, order: 1 }
            ];
            await playlist.save();

            const updatedPlaylist = await Playlist.findById(playlist._id);
            expect(updatedPlaylist.songs).toHaveLength(2);
        });

        it('should add listeners', async () => {
            const playlist = new Playlist({
                name: 'Listener Test',
                owner: testUser._id,
                songs: [],
                listeners: []
            });
            await playlist.save();

            playlist.listeners.push({
                user: testUser._id,
                timestamp: new Date()
            });
            await playlist.save();

            const updatedPlaylist = await Playlist.findById(playlist._id);
            expect(updatedPlaylist.listeners).toHaveLength(1);
        });
    });

    describe('getUniqueListenerCount', () => {
        it('should return correct unique listener count', async () => {
            const user2 = new User({
                email: 'listener2@example.com',
                userName: 'Listener2',
                password: 'password123'
            });
            await user2.save();

            const playlist = new Playlist({
                name: 'Listener Count Test',
                owner: testUser._id,
                songs: [],
                listeners: [
                    { user: testUser._id, timestamp: new Date() },
                    { user: user2._id, timestamp: new Date() },
                    { user: testUser._id, timestamp: new Date() }
                ]
            });
            await playlist.save();

            const count = playlist.getUniqueListenerCount();
            expect(count).toBe(2);
        });

        it('should return 0 for empty listeners', async () => {
            const playlist = new Playlist({
                name: 'No Listeners',
                owner: testUser._id,
                songs: [],
                listeners: []
            });
            await playlist.save();

            const count = playlist.getUniqueListenerCount();
            expect(count).toBe(0);
        });
    });
});
