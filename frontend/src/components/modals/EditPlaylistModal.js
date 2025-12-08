/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import VerifyRemoveSongModal from './VerifyRemoveSongModal';
import AddSong_Transaction from '../../transactions/AddSongTransaction.js';
import RemoveSong_Transaction from '../../transactions/RemoveSongTransaction.js';
import MoveSong_Transaction from '../../transactions/MoveSongTransaction.js';
import DuplicateSong_Transaction from '../../transactions/DuplicateSongTransaction.js';
import ChangeName_Transaction from '../../transactions/ChangeNameTransaction.js';

const EditPlaylistModal = ({ playlist, onClose, user }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // states to keep track of
    const [playlistName, setPlaylistName] = useState(playlist?.name || '');
    const [songs, setSongs] = useState([]);
       const [transactions, setTransactions] = useState([]);
    const [transactionIndex, setTransactionIndex] = useState(-1);
    const [removingSongIndex, setRemovingSongIndex] = useState(null);
    const previousSongsRef = useRef([]);
    const isApplyingTransactionRef = useRef(false);
    const [draggedIndex, setDraggedIndex] = useState(null);

    // immediately loads the playlists and updates their state when they change
    useEffect(() => {
        if (playlist?._id) {
            loadPlaylist();
        } 
        else if (playlist) {
            setPlaylistName('Untitled 0');
            setSongs([]);
            setTransactions([]);
            setTransactionIndex(-1);
        }
    }, [playlist?._id, playlist]);

    // handles reopening the modal after selecting a song
    useEffect(() => {
        if (location.state?.reopenEditModal && location.state?.playlistId && playlist?._id === location.state.playlistId) {
            const previousSongs = JSON.parse(JSON.stringify(songs));
            const previousSongIds = previousSongs
                .map(s => {
                    const songId = s.song?._id || s.song;
                    return songId ? songId.toString() : null;
                })
                .filter(Boolean);

            loadPlaylist(true).then((result) => {
                if (!result) return;

                const newSongItem = result.newSongs.find(s => {
                    const songId = s.song?._id || s.song;
                    return songId && !previousSongIds.includes(songId.toString());
                });

                if (newSongItem && newSongItem.song) {
                    const index = result.newSongs.findIndex(s => {
                        const currentId = s.song?._id || s.song;
                        const newId = newSongItem.song?._id || newSongItem.song;
                        return currentId && newId && currentId.toString() === newId.toString();
                    });

                    if (index !== -1) {
                        setTimeout(() => {
                            const transaction = new AddSong_Transaction(store, index, newSongItem.song);

                            isApplyingTransactionRef.current = true;
                            setTransactions(prevTransactions => {
                                const newTransactions = prevTransactions.slice(0, transactionIndex + 1);
                                newTransactions.push(transaction);
                                setTransactionIndex(newTransactions.length - 1);
                                return newTransactions;
                            });

                            setTimeout(() => {
                                isApplyingTransactionRef.current = false;
                            }, 100);
                        }, 100);
                    }
                }

                window.history.replaceState({}, document.title);
            });
        }
    }, [location.state, playlist?._id]);

    // creates a transaction when new songs are added to the playlist externally
    useEffect(() => {
        if (isApplyingTransactionRef.current) {
            previousSongsRef.current = JSON.parse(JSON.stringify(songs));
            return;
        }

        if (!playlist?._id || previousSongsRef.current.length === songs.length) {
            previousSongsRef.current = JSON.parse(JSON.stringify(songs));
            return;
        }

        if (songs.length > previousSongsRef.current.length) {
            const previousSongIds = previousSongsRef.current
                .map(s => {
                    const songId = s.song?._id || s.song;
                    return songId ? songId.toString() : null;
                })
                .filter(Boolean);

            const newSongItem = songs.find(s => {
                const songId = s.song?._id || s.song;
                return songId && !previousSongIds.includes(songId.toString());
            });

            if (newSongItem && newSongItem.song) {
                const index = songs.findIndex(s => {
                    const currentId = s.song?._id || s.song;
                    const newId = newSongItem.song?._id || newSongItem.song;
                    return currentId && newId && currentId.toString() === newId.toString();
                });

                if (index !== -1) {
                    const transaction = new AddSong_Transaction(store, index, newSongItem.song);
                    executeTransaction(transaction);
                }
            }
        }

        previousSongsRef.current = JSON.parse(JSON.stringify(songs));
    }, [songs.length, playlist?._id]);

    // fetches data for a playlist from server
    const loadPlaylist = async (preserveTransactions = false) => {
        try {
            const response = await axios.get(`/api/playlists/${playlist._id}`);
            const playlistData = response.data;
            setPlaylistName(playlistData.name);
            const sortedSongs = (playlistData.songs || []).sort((a, b) => (a.order || 0) - (b.order || 0));

            const previousSongs = JSON.parse(JSON.stringify(songs));

            setSongs(sortedSongs);

            if (!preserveTransactions) {
                setTransactions([]);
                setTransactionIndex(-1);
            }

            previousSongsRef.current = JSON.parse(JSON.stringify(sortedSongs));

            return { previousSongs, newSongs: sortedSongs };
        } 
        catch (error) {
            console.error('Failed to load playlist:', error);
            return null;
        }
    };

    // handles all playlist operations through store methods
    const store = {
        // adds a song
        addSong: (index, song) => {
            setSongs(prevSongs => {
                const newSongs = [...prevSongs];
                const songItem = {
                    song: song,
                    order: index,
                };
                newSongs.splice(index, 0, songItem);

                for (let i = index + 1; i < newSongs.length; i++) {
                    newSongs[i].order = i;
                }

                return newSongs;
            });
        },

        // removes a song
        removeSong: (index) => {
            setSongs(prevSongs => {
                const newSongs = [...prevSongs];
                newSongs.splice(index, 1);

                for (let i = index; i < newSongs.length; i++) {
                    newSongs[i].order = i;
                }

                return newSongs;
            });
        },

        // moves a song
        moveSong: (fromIndex, toIndex) => {
            setSongs(prevSongs => {
                const newSongs = [...prevSongs];
                const [movedSong] = newSongs.splice(fromIndex, 1);
                newSongs.splice(toIndex, 0, movedSong);

                for (let i = 0; i < newSongs.length; i++) {
                    newSongs[i].order = i;
                }

                return newSongs;
            });
        },

        // duplicates a song
        duplicateSong: (index) => {
            setSongs(prevSongs => {
                const newSongs = [...prevSongs];
                const songToDuplicate = JSON.parse(JSON.stringify(newSongs[index]));
                newSongs.splice(index + 1, 0, songToDuplicate);

                for (let i = 0; i < newSongs.length; i++) {
                    newSongs[i].order = i;
                }

                return newSongs;
            });
        },

        // sets playlist name
        setName: (name) => {
            setPlaylistName(name);
        },
    };

    // executes a transaction and updates history
    const executeTransaction = (transaction) => {
        isApplyingTransactionRef.current = true;

        transaction.executeDo();

        setTransactions(prevTransactions => {
            const newTransactions = prevTransactions.slice(0, transactionIndex + 1);
            newTransactions.push(transaction);
            setTransactionIndex(newTransactions.length - 1);
            return newTransactions;
        });

        setTimeout(() => {
            isApplyingTransactionRef.current = false;
        }, 100);
    };

    // undoes a transaction
    const handleUndo = () => {
        if (transactionIndex >= 0) {
            const transaction = transactions[transactionIndex];
            transaction.executeUndo();
            setTransactionIndex(prev => prev - 1);
        }
    };

    // redoes a transaction
    const handleRedo = () => {
        if (transactionIndex < transactions.length - 1) {
            const nextTransaction = transactions[transactionIndex + 1];
            nextTransaction.executeDo();
            setTransactionIndex(prev => prev + 1);
        }
    };

    // changes playlist name through transaction
    const handleNameChange = (value) => {
        const oldName = playlistName;
        const transaction = new ChangeName_Transaction(store, oldName, value);
        executeTransaction(transaction);
    };

    // navigates to add song page and saves playlist
    const handleAddSong = async () => {
        try {
            const playlistData = {
                name: playlistName || 'Untitled 0',
                songs: songs.map((songItem, index) => ({
                    song: songItem.song?._id || songItem.song,
                    order: index,
                })),
            };

            let savedPlaylist;

            if (!playlist?._id) {
                const response = await axios.post('/api/playlists', playlistData);
                savedPlaylist = response.data;

                setPlaylistName(savedPlaylist.name);
                setSongs(savedPlaylist.songs || []);
            } else {
                const response = await axios.put(`/api/playlists/${playlist._id}`, playlistData);
                savedPlaylist = response.data;
            }

            navigate('/songs', {
                state: {
                    returnTo: 'edit-playlist',
                    playlistId: savedPlaylist._id,
                    newlyCreated: !playlist?._id
                }
            });
        } catch (error) {
            console.error('Failed to save playlist:', error);
            alert(error.response?.data?.error || 'Failed to save playlist. Please try again.');
        }
    };

    // opens confirmation modal for removing a song
    const handleRemoveSong = (index) => {
        setRemovingSongIndex(index);
    };

    // confirms removing a song and creates transaction
    const handleRemoveSongConfirm = () => {
        if (removingSongIndex !== null && songs[removingSongIndex]) {
            const songItem = songs[removingSongIndex];
            const transaction = new RemoveSong_Transaction(store, removingSongIndex, songItem);
            executeTransaction(transaction);
            setRemovingSongIndex(null);
        }
    };

    // duplicates a song through transaction
    const handleDuplicateSong = (index) => {
        const transaction = new DuplicateSong_Transaction(store, index);
        executeTransaction(transaction);
    };

    // handles dragging start
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

    // allows drag over
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    // handles dropping a dragged song and creates move transaction
    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedIndex !== null && draggedIndex !== dropIndex) {
            const transaction = new MoveSong_Transaction(store, draggedIndex, dropIndex);
            executeTransaction(transaction);
        }
        setDraggedIndex(null);
    };

    // resets drag styling on drag end
    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        setDraggedIndex(null);
    };

    // navigates to edit a song
    const handleEditSong = (songItem) => {
        navigate('/songs', { state: { editSongId: songItem.song?._id } });
    };

    // saves playlist and closes modal
    const handleClose = async () => {
        try {
            const playlistData = {
                name: playlistName,
                songs: songs.map((songItem, index) => ({
                    song: songItem.song?._id || songItem.song,
                    order: index,
                })),
            };

            if (playlist?._id) {
                await axios.put(`/api/playlists/${playlist._id}`, playlistData);
            } else if (playlist) {
                if (playlistName || songs.length > 0) {
                    await axios.post('/api/playlists', playlistData);
                }
            }

            onClose();
        } catch (error) {
            console.error('Failed to save playlist:', error);
            alert(error.response?.data?.error || 'Failed to save playlist');
        }
    };

    const canUndo = transactionIndex >= 0;
    const canRedo = transactionIndex < transactions.length - 1;

    if (!playlist) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
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
                        <button onClick={handleAddSong} className="add-song-button">
                            Add Song
                        </button>
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
                                                        {song.title} by {song.artist} ({song.year})
                                                    </div>
                                                    <div className="song-stats">
                                                        <span>
                                                            Listens: {song.listens?.toLocaleString() || 0}
                                                        </span>
                                                        <span>
                                                            Playlists: {song.playlistsCount || 0}
                                                        </span>
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
                        <button
                            onClick={handleUndo}
                            disabled={!canUndo}
                            className="undo-button"
                        >
                            Undo
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={!canRedo}
                            className="redo-button"
                        >
                            Redo
                        </button>
                    </div>
                    <button onClick={handleClose} className="close-button">
                        Close
                    </button>
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
