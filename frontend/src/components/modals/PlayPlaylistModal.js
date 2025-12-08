/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PlayPlaylistModal = ({ playlist, onClose }) => {
    // states to keep track of
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [repeat, setRepeat] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // sorts the songs, maps them to song objects, and then filters out null songs
    const songs = playlist?.songs
        ?.sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(item => item.song)
        .filter(Boolean) || [];

    const currentSong = songs[currentSongIndex];

    // as soon as the user enters the modal and the playlist is loaded, this sends a request to let the server know
    useEffect(() => {
        if (playlist) {
            axios.post(`/api/playlists/${playlist._id}/play`).catch(console.error);
        }
    }, [playlist]);

    // handles going to the previous song by updating the current song index
    const handlePrevious = () => {
        if (currentSongIndex === 0) {
            setCurrentSongIndex(songs.length - 1);
        } 
        else {
            setCurrentSongIndex(prev => prev - 1);
        }
    };

    // handles going to the next song by updating the current song index
    const handleNext = () => {
        if (currentSongIndex === songs.length - 1) {
            if (repeat) {
                setCurrentSongIndex(0);
            } 
            else {
                setIsPlaying(false);
            }
        } 
        else {
            setCurrentSongIndex(prev => prev + 1);
        }
    };

    // handles a manual selection of a song by directly updating the current song index state
    const handleSongSelect = (index) => {
        setCurrentSongIndex(index);
    };

    // helper function to build the youtube embed link
    const getYouTubeEmbedUrl = (youtubeId) => {
        return `https://www.youtube.com/embed/${youtubeId}?autoplay=${isPlaying ? 1 : 0}`;
    };

    if (!playlist) return null;

    // renders the playplaylist modal with the songs dropdown and the youtube video embed
    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2 className="modal-title">Play Playlist</h2>
                    <button onClick={onClose} className="close-button">X</button>
                </div>
                <div className="modal-content">
                    <div className="playlist-songs-panel">
                        {playlist && (
                            <div className="playlist-info">
                                <h3 className="playlist-name">{playlist.name}</h3>
                                {playlist.owner && (
                                    <div className="playlist-owner">
                                        {playlist.owner.avatar && (
                                            <img
                                                src={`data:image/png;base64,${playlist.owner.avatar}`}
                                                alt={playlist.owner.userName}
                                                className="owner-avatar"
                                            />
                                        )}
                                        <span className="owner-name">
                                            {playlist.owner.email || playlist.owner.userName}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="songs-list">
                            {songs.length === 0 ? (
                                <p className="empty-songs-message">No songs in playlist</p>
                            ) : (
                                songs.map((song, index) => (
                                    <div
                                        key={song._id || index}
                                        onClick={() => handleSongSelect(index)}
                                        className={`song-item ${
                                            index === currentSongIndex ? 'song-item-selected' : ''
                                        }`}
                                    >
                                        <div className="song-info">
                                            <div className="song-title">
                                                {song.title} by {song.artist} ({song.year})
                                            </div>
                                            <div className="song-stats">
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
                                    <button onClick={handlePrevious} className="control-button">Previous</button>
                                    <button
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="control-button play-button"
                                    >
                                        Play
                                    </button>
                                    <button onClick={handleNext} className="control-button">Next</button>
                                </div>
                                <div className="repeat-control">
                                    <input
                                        type="checkbox"
                                        checked={repeat}
                                        onChange={(e) => setRepeat(e.target.checked)}
                                        id="repeat-checkbox"
                                    />
                                    <label htmlFor="repeat-checkbox">Repeat</label>
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
