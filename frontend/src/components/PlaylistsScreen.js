/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

// necessary library imports
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// necessary modal imports
import EditPlaylistModal from './modals/EditPlaylistModal';
import PlayPlaylistModal from './modals/PlayPlaylistModal';
import DeletePlaylistModal from './modals/DeletePlaylistModal';

const PlaylistsScreen = ({ user }) => {

    // states to keep track of
    const [playlists, setPlaylists] = useState([]);
    const [filteredPlaylists, setFilteredPlaylists] = useState([]);
    const [filters, setFilters] = useState({
        playlistName: '',
        userName: '',
        songTitle: '',
        songArtist: '',
        songYear: '',
    });
    const [sortBy, setSortBy] = useState('listeners-hi-lo');
    const [expandedPlaylists, setExpandedPlaylists] = useState(new Set());
    const [editingPlaylist, setEditingPlaylist] = useState(null);
    const [playingPlaylist, setPlayingPlaylist] = useState(null);
    const [deletingPlaylist, setDeletingPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);

    // immediately loads the playlists, also reloads whenever user changes
    useEffect(() => {
        loadPlaylists();
    }, [user]);


    useEffect(() => {
        applyFiltersAndSort();
    }, [playlists, filters, sortBy]);


    // contacts the server to receive an array containing all the playlists
    const loadPlaylists = async (forceAll = false) => {
        try {
            setLoading(true);
            const hasFilters = Object.values(filters).some(v => v && v.trim() !== '');
            const params = (user && !hasFilters && !forceAll) ? { ownerOnly: 'true' } : {};
            const response = await axios.get('/api/playlists', { params });
            setPlaylists(response.data);
            return response.data;
        } 
        catch (error) {
            console.error('Failed to load playlists:', error);
            return [];
        } 
        finally {
            setLoading(false);
        }
    };

    // applys filters to the playlists and sorts them
    const applyFiltersAndSort = () => {
        let filtered = [...playlists];

        if (filters.playlistName) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(filters.playlistName.toLowerCase())
            );
        }
        if (filters.userName) {
            filtered = filtered.filter(p =>
                p.owner?.userName?.toLowerCase().includes(filters.userName.toLowerCase())
            );
        }
        if (filters.songTitle || filters.songArtist || filters.songYear) {
            filtered = filtered.filter(p => {
                return p.songs?.some(songItem => {
                    const song = songItem.song;
                    if (!song) return false;
                    const titleMatch = !filters.songTitle ||
                        song.title?.toLowerCase().includes(filters.songTitle.toLowerCase());
                    const artistMatch = !filters.songArtist ||
                        song.artist?.toLowerCase().includes(filters.songArtist.toLowerCase());
                    const yearMatch = !filters.songYear ||
                        song.year?.toString() === filters.songYear;
                    return titleMatch && artistMatch && yearMatch;
                });
            });
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'listeners-hi-lo':
                    return (b.uniqueListenerCount || 0) - (a.uniqueListenerCount || 0);
                case 'listeners-lo-hi':
                    return (a.uniqueListenerCount || 0) - (b.uniqueListenerCount || 0);
                case 'name-a-z':
                    return (a.name || '').localeCompare(b.name || '');
                case 'name-z-a':
                    return (b.name || '').localeCompare(a.name || '');
                case 'user-a-z':
                    return (a.owner?.userName || '').localeCompare(b.owner?.userName || '');
                case 'user-z-a':
                    return (b.owner?.userName || '').localeCompare(a.owner?.userName || '');
                default:
                    return 0;
            }
        });

        setFilteredPlaylists(filtered);
    };

    // updates the filters state whenever they are changed
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    // searches by first loading in all the playlists and then filtering and sorting based off the inputs
    const handleSearch = async () => {
        await loadPlaylists(true);
        applyFiltersAndSort();
    };

    // handles clearing the values in the filter state, updating them to empty
    const handleClear = async () => {
        setFilters({
            playlistName: '',
            userName: '',
            songTitle: '',
            songArtist: '',
            songYear: '',
        });
        await loadPlaylists();
        applyFiltersAndSort();
    };

    // search on each keypress, results will update as user types
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // manages which playlists are expanded
    const toggleExpand = (playlistId) => {
        setExpandedPlaylists(prev => {
            const newSet = new Set(prev);
            if (newSet.has(playlistId)) {
                newSet.delete(playlistId);
            } 
            else {
                newSet.add(playlistId);
            }
            return newSet;
        });
    };

    // sets the state of the playling playlist to the passed in playlist
    const handlePlay = (playlist) => {
        setPlayingPlaylist(playlist);
    };

    // checks if the user owns the playlist before allowing him to edit
    const handleEdit = (playlist) => {
        if (user && playlist.owner && playlist.owner._id === user._id) {
            setEditingPlaylist(playlist);
        }
    };

    // contacts the server and makes a copy of a playlist
    const handleCopy = async (playlist) => {
        if (!user) return;
        try {
            await axios.post(`/api/playlists/${playlist._id}/copy`);
            loadPlaylists();
        } 
        catch (error) {
            console.error('Failed to copy playlist:', error);
        }
    };

    // sets the state of the playlist deleting
    const handleDelete = (playlist) => {
        if (user && playlist.owner && playlist.owner._id === user._id) {
            setDeletingPlaylist(playlist);
        }
    };

    // sends a request to the backend to guranteed delete a playlist. Also sets the deleting playlists property back to null and reloads playlists
    const handleDeleteConfirm = async () => {
        if (!deletingPlaylist) return;
        try {
            await axios.delete(`/api/playlists/${deletingPlaylist._id}`);
            setDeletingPlaylist(null);
            loadPlaylists();
        } 
        catch (error) {
            console.error('Failed to delete playlist:', error);
        }
    };

    // handles the creation of a new playlist
    const handleCreatePlaylist = () => {
        if (!user) return;
        const newPlaylist = {
            name: '',
            songs: [],
            owner: user,
        };
        setEditingPlaylist(newPlaylist);
    };

    // check to see if a playlist belongs to the current user
    const isOwner = (playlist) => {
        return user && playlist.owner && playlist.owner._id === user._id;
    };

    return (
        <div className="playlists-screen">
            <div className="playlists-container">
                <div className="playlists-sidebar">
                    <h1 className="playlists-title">Playlists</h1>
                    <div className="filter-section">
                        {[
                            { key: 'playlistName', label: 'by Playlist Name' },
                            { key: 'userName', label: 'by User Name' },
                            { key: 'songTitle', label: 'by Song Title' },
                            { key: 'songArtist', label: 'by Song Artist' },
                            { key: 'songYear', label: 'by Song Year' },
                        ].map(({ key, label }) => (
                            <div key={key} className="filter-field">
                                <label>{label}</label>
                                <div className="filter-input-wrapper">
                                    <input
                                        type="text"
                                        value={filters[key]}
                                        onChange={(e) => handleFilterChange(key, e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="filter-input"
                                    />
                                    {filters[key] && (
                                        <button
                                            type="button"
                                            onClick={() => handleFilterChange(key, '')}
                                            className="clear-button"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div className="filter-actions">
                            <button onClick={handleSearch} className="search-button">
                                Search
                            </button>
                            <button onClick={handleClear} className="clear-button">
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                <div className="playlists-main">
                    <div className="playlists-header">
                        <div className="sort-section">
                            <label>Sort:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="sort-select"
                            >
                                <option value="listeners-hi-lo">Listeners (Hi-Lo)</option>
                                <option value="listeners-lo-hi">Listeners (Lo-Hi)</option>
                                <option value="name-a-z">Playlist Name (A-Z)</option>
                                <option value="name-z-a">Playlist Name (Z-A)</option>
                                <option value="user-a-z">User Name (A-Z)</option>
                                <option value="user-z-a">User Name (Z-A)</option>
                            </select>
                            <span className="playlist-count">
                                {filteredPlaylists.length} Playlist
                                {filteredPlaylists.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    <div className="playlists-list">
                        {loading ? (
                            <div className="loading-message">Loading...</div>
                        ) : filteredPlaylists.length === 0 ? (
                            <div className="empty-message">No playlists found</div>
                        ) : (
                            filteredPlaylists.map((playlist) => (
                                <div key={playlist._id} className="playlist-card">
                                    <div className="playlist-card-header">
                                        <div className="playlist-avatar">
                                            {playlist.name?.[0]?.toUpperCase() || 'P'}
                                        </div>
                                        <div className="playlist-info">
                                            <div className="playlist-name">{playlist.name}</div>
                                            <div className="playlist-owner">
                                                {playlist.owner?.userName || 'Unknown'}
                                            </div>
                                            <div className="playlist-listeners">
                                                {playlist.uniqueListenerCount || 0} Listener
                                                {playlist.uniqueListenerCount !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        <div className="playlist-actions">
                                            {isOwner(playlist) && (
                                                <>
                                                    <button
                                                        onClick={() => handleDelete(playlist)}
                                                        className="action-button"
                                                    >
                                                        Delete
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(playlist)}
                                                        className="action-button"
                                                    >
                                                        Edit
                                                    </button>
                                                </>
                                            )}
                                            {user && (
                                                <button
                                                    onClick={() => handleCopy(playlist)}
                                                    className="action-button"
                                                >
                                                    Copy
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handlePlay(playlist)}
                                                className="action-button"
                                            >
                                                Play
                                            </button>
                                            <button
                                                onClick={() => toggleExpand(playlist._id)}
                                                className="expand-button"
                                            >
                                                {expandedPlaylists.has(playlist._id) ? '▼' : '▶'}
                                            </button>
                                        </div>
                                    </div>

                                    {expandedPlaylists.has(playlist._id) && (
                                        <div className="playlist-songs">
                                            {playlist.songs && playlist.songs.length > 0 ? (
                                                <ol className="songs-list">
                                                    {playlist.songs
                                                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                        .map((songItem, index) => {
                                                            const song = songItem.song;
                                                            if (!song) return null;
                                                            return (
                                                                <li
                                                                    key={songItem._id || index}
                                                                    className="song-item"
                                                                >
                                                                    {song.title} by {song.artist} ({song.year})
                                                                    {song.duration && ` - ${song.duration}`}
                                                                </li>
                                                            );
                                                        })}
                                                </ol>
                                            ) : (
                                                <div className="empty-songs">
                                                    No songs in this playlist
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {user && (
                        <div className="create-playlist-section">
                            <button
                                onClick={handleCreatePlaylist}
                                className="create-button"
                            >
                                New Playlist
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {editingPlaylist && (
                <EditPlaylistModal
                    playlist={editingPlaylist}
                    onClose={async () => {
                        setEditingPlaylist(null);
                        await loadPlaylists();
                    }}
                    user={user}
                />
            )}

            {playingPlaylist && (
                <PlayPlaylistModal
                    playlist={playingPlaylist}
                    onClose={() => setPlayingPlaylist(null)}
                />
            )}

            {deletingPlaylist && (
                <DeletePlaylistModal
                    playlist={deletingPlaylist}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeletingPlaylist(null)}
                />
            )}
        </div>
    );
};

export default PlaylistsScreen;
