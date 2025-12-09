/**
 * Syed Faruque
 * SBU-ID: 116340094
 */


import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import VerifyRemoveSongModal from './VerifyRemoveSongModal';
import AddSong_Transaction from '../../transactions/AddSongTransaction.js';
import RemoveSong_Transaction from '../../transactions/RemoveSongTransaction.js';
import MoveSong_Transaction from '../../transactions/MoveSongTransaction.js';
import DuplicateSong_Transaction from '../../transactions/DuplicateSongTransaction.js';
import ChangeName_Transaction from '../../transactions/ChangeNameTransaction.js';

const EditPlaylistModal = ({ playlist, onClose, user }) => {
    const navigate = useNavigate();
    const [playlistName, setPlaylistName] = useState(playlist?.name || '');
    const [songs, setSongs] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [transactionIndex, setTransactionIndex] = useState(-1);
    const [removingSongIndex, setRemovingSongIndex] = useState(null);
    const previousSongsRef = useRef([]);
    const isApplyingTransactionRef = useRef(false);
    const [draggedIndex, setDraggedIndex] = useState(null);

    // load playlist
    useEffect(() => {
        if (playlist?._id) {
            loadPlaylist();
        } else if (playlist) {
            setPlaylistName('Untitled 0');
            setSongs([]);
            setTransactions([]);
            setTransactionIndex(-1);
        }
    }, [playlist?._id, playlist]);

    // track previous songs
    useEffect(() => {
        if (isApplyingTransactionRef.current) return;
        previousSongsRef.current = JSON.parse(JSON.stringify(songs));
    }, [songs]);

    // load playlist data
    const loadPlaylist = async () => {
        try {
            const response = await axios.get(`/api/playlists/${playlist._id}`);
            const playlistData = response.data;

            setPlaylistName(playlistData.name);

            const sortedSongs = (playlistData.songs || [])
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            setSongs(sortedSongs);
            setTransactions([]);
            setTransactionIndex(-1);

            previousSongsRef.current = JSON.parse(JSON.stringify(sortedSongs));
        } 
        catch (error) {
            console.error('Failed to load playlist:', error);
        }
    };

    // transaction store
    const store = {
        addSong: (index, songOrSongItem) => {
            setSongs(prev => {
                const newSongs = [...prev];

                const songItem = songOrSongItem.song
                    ? songOrSongItem
                    : { song: songOrSongItem, order: index };

                newSongs.splice(index, 0, songItem);

                for (let i = index + 1; i < newSongs.length; i++) {
                    newSongs[i].order = i;
                }

                return newSongs;
            });
        },

        removeSong: (index) => {
            setSongs(prev => {
                const newSongs = [...prev];
                newSongs.splice(index, 1);

                for (let i = index; i < newSongs.length; i++) {
                    newSongs[i].order = i;
                }

                return newSongs;
            });
        },

        moveSong: (fromIndex, toIndex) => {
            setSongs(prev => {
                const newSongs = [...prev];
                const [moved] = newSongs.splice(fromIndex, 1);
                newSongs.splice(toIndex, 0, moved);

                for (let i = 0; i < newSongs.length; i++) {
                    newSongs[i].order = i;
                }

                return newSongs;
            });
        },

        duplicateSong: (index) => {
            setSongs(prev => {
                const newSongs = [...prev];
                const copy = JSON.parse(JSON.stringify(newSongs[index]));
                newSongs.splice(index + 1, 0, copy);

                for (let i = 0; i < newSongs.length; i++) {
                    newSongs[i].order = i;
                }

                return newSongs;
            });
        },

        setName: (name) => {
            setPlaylistName(name);
        }
    };

    // run transaction
    const executeTransaction = (transaction) => {
        isApplyingTransactionRef.current = true;

        transaction.executeDo();

        setTransactions(prev => {
            const newList = prev.slice(0, transactionIndex + 1);
            newList.push(transaction);
            setTransactionIndex(newList.length - 1);
            return newList;
        });

        setTimeout(() => {
            isApplyingTransactionRef.current = false;
        }, 100);
    };

    // undo
    const handleUndo = () => {
        if (transactionIndex >= 0) {
            isApplyingTransactionRef.current = true;

            const t = transactions[transactionIndex];
            t.executeUndo();

            setTransactionIndex(prev => prev - 1);

            setTimeout(() => {
                isApplyingTransactionRef.current = false;
            }, 100);
        }
    };

    // redo
    const handleRedo = () => {
        if (transactionIndex < transactions.length - 1) {
            isApplyingTransactionRef.current = true;

            const t = transactions[transactionIndex + 1];
            t.executeDo();

            setTransactionIndex(prev => prev + 1);

            setTimeout(() => {
                isApplyingTransactionRef.current = false;
            }, 100);
        }
    };

    // name change
    const handleNameChange = (value) => {
        const old = playlistName;
        const transaction = new ChangeName_Transaction(store, old, value);
        executeTransaction(transaction);
    };

    // add song
    const handleAddSong = async () => {
        try {
            const playlistData = {
                name: playlistName || 'Untitled 0',
                songs: songs.map((item, index) => ({
                    song: item.song?._id || item.song,
                    order: index
                }))
            };

            if (!playlist?._id) {
                const response = await axios.post('/api/playlists', playlistData);
                const saved = response.data;
                setPlaylistName(saved.name);
                setSongs(saved.songs || []);
            } else {
                await axios.put(`/api/playlists/${playlist._id}`, playlistData);
            }

            navigate('/songs');
        } catch (error) {
            console.error('Failed to save playlist:', error);
            alert(error.response?.data?.error || 'Failed to save playlist. Please try again.');
        }
    };

    // remove song
    const handleRemoveSong = (index) => {
        setRemovingSongIndex(index);
    };

    // confirm removal
    const handleRemoveSongConfirm = () => {
        if (removingSongIndex !== null && songs[removingSongIndex]) {
            const songItem = songs[removingSongIndex];
            const t = new RemoveSong_Transaction(store, removingSongIndex, songItem);
            executeTransaction(t);
            setRemovingSongIndex(null);
        }
    };

    // duplicate song
    const handleDuplicateSong = (index) => {
        const t = new DuplicateSong_Transaction(store, index);
        executeTransaction(t);
    };

    // drag start
    const handleDragStart = (e, index) => {
        if (e.target.closest('button') || e.target.closest('[role="button"]')) {
            e.preventDefault();
            return;
        }
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
        e.currentTarget.style.opacity = '0.5';
    };

    // drag over
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    // drop
    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedIndex !== null && draggedIndex !== dropIndex) {
            const t = new MoveSong_Transaction(store, draggedIndex, dropIndex);
            executeTransaction(t);
        }

        setDraggedIndex(null);
    };

    // drag end
    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        setDraggedIndex(null);
    };

    // edit song
    const handleEditSong = (songItem) => {
        if (songItem.song) {
            navigate('/songs', {
                state: {
                    editSongId: songItem.song._id,
                    returnToEditPlaylist: playlist._id
                }
            });
        }
    };

    // close modal
    const handleClose = async () => {
        try {
            const playlistData = {
                name: playlistName,
                songs: songs.map((item, index) => ({
                    song: item.song?._id || item.song,
                    order: index
                }))
            };

            if (playlist?._id) {
                await axios.put(`/api/playlists/${playlist._id}`, playlistData);
            } 
            else if (playlist) {
                if (playlistName || songs.length > 0) {
                    await axios.post('/api/playlists', playlistData);
                }
            }

            onClose();
        } 
        catch (error) {
            console.error('Failed to save playlist:', error);
            alert(error.response?.data?.error || 'Failed to save playlist');
        }
    };

    const canUndo = transactionIndex >= 0;
    const canRedo = transactionIndex < transactions.length - 1;

    if (!playlist) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container edit-playlist-modal">
                <div className="modal-header">
                    <h2 className="modal-title">Edit Playlist</h2>
                    <button onClick={handleClose} className="close-button">X</button>
                </div>

                <div className="modal-content">
                    <div className="playlist-name-section">
                        <div className="name-input-wrapper">
                            <input
                                type="text"
                                value={playlistName}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="playlist-name-input"
                                placeholder="Playlist name"
                            />
                            {playlistName && (
                                <button
                                    type="button"
                                    onClick={() => handleNameChange('')}
                                    className="clear-button"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <button onClick={handleAddSong} className="add-song-button">Add Song</button>
                    </div>

                    <div className="songs-container">
                        {songs.length === 0 ? (
                            <p className="empty-songs-message">
                                No songs in playlist. Click "Add Song" to add songs.
                            </p>
                        ) : (
                            <div className="songs-list">
                                {songs.map((songItem, index) => {
                                    const song = songItem.song;
                                    if (!song) return null;

                                    return (
                                        <div
                                            key={songItem._id || `${song._id}-${index}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, index)}
                                            onDragEnd={handleDragEnd}
                                            className="song-item-draggable"
                                        >
                                            <div className="song-item-content">
                                                <div className="song-info">
                                                    <div className="song-title">
                                                        {index + 1}. {song.title} by {song.artist} ({song.year})
                                                    </div>
                                                </div>

                                                <div className="song-actions">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditSong(songItem);
                                                        }}
                                                        className="song-action-button"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDuplicateSong(index);
                                                        }}
                                                        className="song-action-button"
                                                    >
                                                        Duplicate
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveSong(index);
                                                        }}
                                                        className="song-action-button"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-actions">
                    <div className="undo-redo-section">
                        <button onClick={handleUndo} disabled={!canUndo} className="undo-button">
                            Undo
                        </button>
                        <button onClick={handleRedo} disabled={!canRedo} className="redo-button">
                            Redo
                        </button>
                    </div>

                    <button onClick={handleClose} className="close-button-action">Close</button>
                </div>
            </div>

            {removingSongIndex !== null && songs[removingSongIndex] && (
                <VerifyRemoveSongModal
                    song={songs[removingSongIndex].song}
                    onConfirm={handleRemoveSongConfirm}
                    onCancel={() => setRemovingSongIndex(null)}
                />
            )}
        </div>
    );
};

export default EditPlaylistModal;
