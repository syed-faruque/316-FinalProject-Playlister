/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

// imports
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import playlistRoutes from './routes/playlists.js';
import songRoutes from './routes/songs.js';
import userRoutes from './routes/users.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;


// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'playlister-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/playlister')
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/users', userRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});


// Makes the app listen on designated port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
