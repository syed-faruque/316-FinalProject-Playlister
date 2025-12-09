/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PlayPlaylistModal = ({ playlist, onClose }) => {
    // Handles local component state for current song index, repeat toggle, and play/pause state
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [repeat, setRepeat] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Prepares ordered list of songs from playlist
    const songs = playlist?.songs
        ?.sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(item => item.song)
        .filter(Boolean) || [];

    const currentSong = songs[currentSongIndex];

    // Sends "play" request when modal opens and playlist is active
    useEffect(() => {
        if (playlist) {
            axios.post(`/api/playlists/${playlist._id}/play`).catch(console.error);
        }
    }, [playlist]);

    // Moves to the previous song in the list
    const handlePrevious = () => {
        if (currentSongIndex === 0) {
            setCurrentSongIndex(songs.length - 1);
        } 
        else {
            setCurrentSongIndex(prev => prev - 1);
        }
    };

    // Moves to the next song (loops if repeat is on)
    const handleNext = () => {
        if (currentSongIndex === songs.length - 1) {
            if (repeat) {
                setCurrentSongIndex(0);
            } 
            else {
                setIsPlaying(false);
            }
        } else {
            setCurrentSongIndex(prev => prev + 1);
        }
    };

    // Allows choosing a specific song from the list
    const handleSongSelect = (index) => {
        setCurrentSongIndex(index);
    };

    // Builds a YouTube embed URL with autoplay logic
    const getYouTubeEmbedUrl = (youtubeId) => {
        return `https://www.youtube.com/embed/${youtubeId}?autoplay=${isPlaying ? 1 : 0}`;
    };

    if (!playlist) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container play-playlist-modal">
                <div className="modal-header">
                    <h2 className="modal-title">Play Playlist</h2>
                    <button onClick={onClose} className="close-button">X</button>
                </div>
                <div className="modal-content play-playlist-content">
                    <div className="playlist-songs-panel">
                        {playlist && (
                            <div className="playlist-info">
                                <h3 className="playlist-name">{playlist.name}</h3>
                                {playlist.owner && (
                                    <div className="playlist-owner">
                                        {playlist.owner.avatar ? (
                                            <img
                                                src={`data:image/png;base64,${playlist.owner.avatar}`}
                                                alt={playlist.owner.userName}
                                                className="owner-avatar"
                                            />
                                        ) : (
                                            <span className="owner-avatar-placeholder">👤</span>
                                        )}
                                        <span className="owner-name">
                                            {playlist.owner.email || playlist.owner.userName}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="playlist-songs-scrollable">
                            {songs.length === 0 ? (
                                <p className="empty-songs-message">No songs in playlist</p>
                            ) : (
                                songs.map((song, index) => (
                                    <div
                                        key={song._id || index}
                                        onClick={() => handleSongSelect(index)}
                                        className={`playlist-song-item ${index === currentSongIndex ? 'playlist-song-selected' : ''}`}
                                    >
                                        <div className="playlist-song-info">
                                            <div className="playlist-song-title">
                                                {song.title} by {song.artist} ({song.year})
                                            </div>
                                            <div className="playlist-song-stats">
                                                <span>Listens: {song.listens?.toLocaleString() || 0}</span>
                                                <span>Playlists: {song.playlistsCount || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="video-player-panel">
                        {currentSong ? (
                            <div className="video-container">
                                <div className="youtube-embed">
                                    <iframe
                                        title={`YouTube video player for ${currentSong.title}`}
                                        width="100%"
                                        height="100%"
                                        src={getYouTubeEmbedUrl(currentSong.youtubeId)}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                                <div className="video-controls">
                                    <button onClick={handlePrevious} className="control-button arrow-button">◀</button>
                                    <button
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="control-button play-button"
                                    >
                                        {isPlaying ? '⏸' : '▶'}
                                    </button>
                                    <button onClick={handleNext} className="control-button arrow-button">▶</button>
                                </div>
                                <div className="repeat-control">
                                    <input
                                        type="checkbox"
                                        checked={repeat}
                                        onChange={(e) => setRepeat(e.target.checked)}
                                        id="repeat-checkbox"
                                        className="repeat-checkbox"
                                    />
                                    <label htmlFor="repeat-checkbox" className="repeat-label">Repeat</label>
                                </div>
                            </div>
                        ) : (
                            <p className="empty-songs-message">No songs in playlist</p>
                        )}
                    </div>
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="close-button">Close</button>
                </div>
            </div>
        </div>
    );
};

export default PlayPlaylistModal;
