/**
 * Syed Faruque
 * SBU-ID: 116340094
 */


import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  youtubeId: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    default: ''
  },
  listens: {
    type: Number,
    default: 0
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness of title, artist, year combination
songSchema.index({ title: 1, artist: 1, year: 1 }, { unique: true });

// Virtual for playlists count (will be calculated)
songSchema.virtual('playlistsCount', {
  ref: 'Playlist',
  localField: '_id',
  foreignField: 'songs.song',
  count: true
});

export default mongoose.model('Song', songSchema);

