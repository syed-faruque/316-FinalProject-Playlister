/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  songs: [{
    song: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song',
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  listeners: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

// Compound index to ensure unique playlist names per user
playlistSchema.index({ name: 1, owner: 1 }, { unique: true });

// Method to get unique listener count
playlistSchema.methods.getUniqueListenerCount = function() {
  const uniqueUserIds = new Set(
    this.listeners.map(listener => listener.user.toString())
  );
  return uniqueUserIds.size;
};

export default mongoose.model('Playlist', playlistSchema);