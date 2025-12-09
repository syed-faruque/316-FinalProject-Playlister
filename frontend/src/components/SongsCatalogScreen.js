import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditSongModal from './modals/EditSongModal';
import RemoveSongModal from './modals/RemoveSongModal';
import AddSongModal from './modals/AddSongModal';

const SongsCatalogScreen = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [songs, setSongs] = useState([]);
    const [filteredSongs, setFilteredSongs] = useState([]);
    const [selectedSong, setSelectedSong] = useState(null);
    const [filters, setFilters] = useState({
        title: '',
        artist: '',
        year: '',
    });
    const [sortBy, setSortBy] = useState('listens-hi-lo');
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuSong, setMenuSong] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [editingSong, setEditingSong] = useState(null);
    const [removingSong, setRemovingSong] = useState(null);
    const [addingSong, setAddingSong] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [playlistMenuAnchor, setPlaylistMenuAnchor] = useState(null);
    const [loading, setLoading] = useState(true);
    const addToPlaylistMenuItemRef = useRef(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Loads songs from the server with the current filters applied
    const loadSongs = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.title) params.title = filters.title;
            if (filters.artist) params.artist = filters.artist;
            if (filters.year) params.year = filters.year;

            const response = await axios.get('/api/songs', { params });
            setSongs(response.data);
        } 
        catch (error) {
            console.error('Failed to load songs:', error);
        } 
        finally {
            setLoading(false);
        }
    }, [filters.title, filters.artist, filters.year]);

    // Loads the playlists owned by the current user from the server
    const loadPlaylists = useCallback(async () => {
        if (!user) return [];
        try {
            const response = await axios.get('/api/playlists', { params: { ownerOnly: 'true' } });
            const playlistsData = response.data || [];
            setPlaylists(playlistsData);
            return playlistsData;
        } 
        catch (error) {
            console.error('Failed to load playlists:', error);
            setPlaylists([]);
            return [];
        }
    }, [user]);

    // Filters and sorts the songs array based on user input and sort options
    const applyFiltersAndSort = () => {
        let filtered = [...songs];

        if (filters.title) {
            filtered = filtered.filter(s =>
                s.title?.toLowerCase().includes(filters.title.toLowerCase())
            );
        }
        if (filters.artist) {
            filtered = filtered.filter(s =>
                s.artist?.toLowerCase().includes(filters.artist.toLowerCase())
            );
        }
        if (filters.year) {
            filtered = filtered.filter(s =>
                s.year?.toString() === filters.year
            );
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'listens-hi-lo':
                    return (b.listens || 0) - (a.listens || 0);
                case 'listens-lo-hi':
                    return (a.listens || 0) - (b.listens || 0);
                case 'playlists-hi-lo':
                    return (b.playlistsCount || 0) - (a.playlistsCount || 0);
                case 'playlists-lo-hi':
                    return (a.playlistsCount || 0) - (b.playlistsCount || 0);
                case 'title-a-z':
                    return (a.title || '').localeCompare(b.title || '');
                case 'title-z-a':
                    return (b.title || '').localeCompare(a.title || '');
                case 'artist-a-z':
                    return (a.artist || '').localeCompare(b.artist || '');
                case 'artist-z-a':
                    return (b.artist || '').localeCompare(a.artist || '');
                case 'year-hi-lo':
                    return (b.year || 0) - (a.year || 0);
                case 'year-lo-hi':
                    return (a.year || 0) - (b.year || 0);
                default:
                    return 0;
            }
        });

        setFilteredSongs(filtered);
    };

    // Updates the filter value for a given field in state
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    // Executes a search by reloading songs with current filters
    const handleSearch = () => {
        loadSongs();
    };

    // Clears all filters and reloads all songs
    const handleClear = () => {
        setFilters({
            title: '',
            artist: '',
            year: '',
        });
        loadSongs();
    };

    // Triggers search on Enter key press in any filter input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Handles clicking on a song, setting it as selected and incrementing listen count
    const handleSongClick = async (song, event) => {
        if (event?.target?.closest('button') || event?.target?.closest('[role="button"]')) {
            return;
        }

        setSelectedSong(song);
        axios.post(`/api/songs/${song._id}/listen`).catch(console.error);
    };

    // Opens the menu for a specific song at the given event target
    const handleMenuOpen = (event, song) => {
        setMenuAnchor(event.currentTarget);
        setMenuSong(song);
    };

    // Closes both the main song menu and playlist submenu
    const handleMenuClose = useCallback(() => {
        setMenuAnchor(null);
        setMenuSong(null);
        setPlaylistMenuAnchor(null);
    }, []);

    // Opens the EditSongModal for the currently selected song if user owns it
    const handleEdit = () => {
        if (menuSong && user && menuSong.owner._id === user._id) {
            setEditingSong(menuSong);
            handleMenuClose();
        }
    };

    // Opens the RemoveSongModal for the currently selected song if user owns it
    const handleRemove = () => {
        if (menuSong && user && menuSong.owner._id === user._id) {
            setRemovingSong(menuSong);
            handleMenuClose();
        }
    };

    // Toggles the Add to Playlist submenu and loads playlists if needed
    const handleAddToPlaylist = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!user || !menuSong) return;

        await loadPlaylists();

        if (playlistMenuAnchor) {
            setPlaylistMenuAnchor(null);
        } 
        else {
            const anchorElement = addToPlaylistMenuItemRef.current;
            if (anchorElement) {
                setPlaylistMenuAnchor(anchorElement);
            }
        }
    };

    // Handles adding the currently selected song to a chosen playlist
    const handlePlaylistSelect = async (playlistId) => {
        if (!menuSong || !user) return;

        setPlaylistMenuAnchor(null);
        handleMenuClose();

        try {
            const playlist = await axios.get(`/api/playlists/${playlistId}`);
            const currentSongs = playlist.data.songs || [];

            const songExists = currentSongs.some(s =>
                (s.song?._id || s.song) === menuSong._id
            );

            if (songExists) {
                setSnackbar({
                    open: true,
                    message: `"${menuSong.title}" is already in "${playlist.data.name}"`,
                    severity: 'info',
                });
                return;
            }

            const maxOrder = currentSongs.length > 0
                ? Math.max(...currentSongs.map(s => s.order || 0))
                : -1;

            await axios.put(`/api/playlists/${playlistId}`, {
                name: playlist.data.name,
                songs: [
                    ...currentSongs.map(s => ({
                        song: s.song?._id || s.song,
                        order: s.order || 0,
                    })),
                    {
                        song: menuSong._id,
                        order: maxOrder + 1,
                    },
                ],
            });

            setSnackbar({
                open: true,
                message: `Added "${menuSong.title}" to "${playlist.data.name}"`,
            });
        } 
        catch (error) {
            console.error('Failed to add song to playlist:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.error || 'Failed to add song to playlist',
                severity: 'error',
            });
        }
    };

    // Confirms removal of a song from the catalog and updates state accordingly
    const handleRemoveConfirm = async () => {
        if (!removingSong) return;
        try {
            await axios.delete(`/api/songs/${removingSong._id}`);
            setRemovingSong(null);
            loadSongs();
            if (selectedSong?._id === removingSong._id) {
                setSelectedSong(null);
            }
        } 
        catch (error) {
            console.error('Failed to remove song:', error);
        }
    };

    // Returns true if the logged-in user owns the given song
    const isOwner = (song) => {
        return user && song.owner._id === user._id;
    };

    // Generates a YouTube embed URL for a given YouTube video ID
    const getYouTubeEmbedUrl = (youtubeId) => {
        return `https://www.youtube.com/embed/${youtubeId}`;
    };

    // Returns playlists sorted by most recently updated or created
    const sortedPlaylists = [...playlists].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
    });

    // Updates menu position relative to button whenever the anchor changes
    useEffect(() => {
        if (menuAnchor) {
            const rect = menuAnchor.getBoundingClientRect();
            const menuWidth = 180;
            const viewportWidth = window.innerWidth;

            let left = rect.left;
            if (left + menuWidth > viewportWidth) {
                left = rect.right - menuWidth;
            }
            if (left < 0) {
                left = 8;
            }

            setMenuPosition({
                top: rect.bottom + 2,
                left: left,
            });
        }
    }, [menuAnchor]);

    // Adds a click listener to close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (playlistMenuAnchor && !event.target.closest('.playlist-submenu') && !event.target.closest('.menu-item')) {
                setPlaylistMenuAnchor(null);
                return;
            }
            if (menuAnchor && !event.target.closest('.song-menu') && !event.target.closest('.song-menu-button') && !event.target.closest('.playlist-submenu')) {
                handleMenuClose();
            }
        };

        if (menuAnchor || playlistMenuAnchor) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [menuAnchor, playlistMenuAnchor, handleMenuClose]);

    // Loads songs and playlists initially and whenever user changes
    useEffect(() => {
        loadSongs();
        if (user) {
            loadPlaylists();
        }
    }, [user]);

    // Opens EditSongModal automatically if location state indicates a song to edit
    useEffect(() => {
        if (location.state?.editSongId && songs.length > 0) {
            const songToEdit = songs.find(s => s._id === location.state.editSongId);
            if (songToEdit) {
                setEditingSong(songToEdit);
                window.history.replaceState({}, document.title);
            }
        }
    }, [songs, location.state?.editSongId]);

    // Applies filters and sorting whenever songs, filters, or sort option changes
    useEffect(() => {
        applyFiltersAndSort();
    }, [songs, filters, sortBy]);

    return (
        <div className="songs-catalog-screen">
            <div className="songs-container">
                <div className="songs-sidebar">
                    <h1 className="songs-title">Songs Catalog</h1>
                    {[
                        { key: 'title', label: 'by Title' },
                        { key: 'artist', label: 'by Artist' },
                        { key: 'year', label: 'by Year' },
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
                                    <button type="button" onClick={() => handleFilterChange(key, '')} className="clear-button">✕</button>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="filter-actions">
                        <button onClick={handleSearch} className="search-button">Search</button>
                        <button onClick={handleClear} className="clear-button">Clear</button>
                    </div>

                    {selectedSong && (
                        <div className="youtube-player">
                            <iframe
                                title={`YouTube video player for ${selectedSong.title}`}
                                width="100%"
                                height="315"
                                src={getYouTubeEmbedUrl(selectedSong.youtubeId)}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}
                </div>

                <div className="songs-main">
                    <div className="songs-header">
                        <div className="sort-section">
                            <label>Sort:</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                                <option value="listens-hi-lo">Listens (Hi-Lo)</option>
                                <option value="listens-lo-hi">Listens (Lo-Hi)</option>
                                <option value="playlists-hi-lo">Playlists (Hi-Lo)</option>
                                <option value="playlists-lo-hi">Playlists (Lo-Hi)</option>
                                <option value="title-a-z">Title (A-Z)</option>
                                <option value="title-z-a">Title (Z-A)</option>
                                <option value="artist-a-z">Artist (A-Z)</option>
                                <option value="artist-z-a">Artist (Z-A)</option>
                                <option value="year-hi-lo">Year (Hi-Lo)</option>
                                <option value="year-lo-hi">Year (Lo-Hi)</option>
                            </select>
                            <span className="song-count">{filteredSongs.length} Song{filteredSongs.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    <div className="songs-list">
                        {loading ? (
                            <div className="loading-message">Loading...</div>
                        ) : filteredSongs.length === 0 ? (
                            <div className="empty-message">No songs found</div>
                        ) : (
                            filteredSongs.map((song) => (
                                <div
                                    key={song._id}
                                    onClick={(e) => handleSongClick(song, e)}
                                    className="song-card"
                                >
                                    <div className="song-card-content">
                                        <div className="song-info">
                                            <div className="song-title">{song.title} by {song.artist} ({song.year})</div>
                                            <div className="song-stats">
                                                <span>Listens: {song.listens?.toLocaleString() || 0}</span>
                                                <span>Playlists: {song.playlistsCount || 0}</span>
                                            </div>
                                        </div>
                                        {user && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMenuOpen(e, song);
                                                }}
                                                className="song-menu-button"
                                            >
                                                ⋮
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {user && (
                        <div className="create-song-section">
                            <button onClick={() => setAddingSong(true)} className="create-button">New Song</button>
                        </div>
                    )}
                </div>
            </div>

            {menuAnchor && (
                <div 
                    className="song-menu"
                    style={{
                        position: 'fixed',
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                        zIndex: 1001,
                    }}
                >
                    {user && menuSong && (
                        <>
                            <div
                                ref={addToPlaylistMenuItemRef}
                                onClick={(e) => { handleAddToPlaylist(e); }}
                                className="menu-item"
                                style={{ position: 'relative' }}
                            >
                                Add to Playlist
                                {playlistMenuAnchor && addToPlaylistMenuItemRef.current && (
                                    <div 
                                        className="playlist-submenu"
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            marginTop: '2px',
                                            zIndex: 1500,
                                        }}
                                    >
                                        {sortedPlaylists.length === 0 ? (
                                            <div className="empty-menu">No playlists available</div>
                                        ) : (
                                            sortedPlaylists.map((playlist) => (
                                                <div
                                                    key={playlist._id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePlaylistSelect(playlist._id);
                                                    }}
                                                    className="submenu-item"
                                                >
                                                    {playlist.name}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                            {isOwner(menuSong) && (
                                <>
                                    <div onClick={handleEdit} className="menu-item">Edit Song</div>
                                    <div onClick={handleRemove} className="menu-item">Remove from Catalog</div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}

            {editingSong && (
                <EditSongModal
                    song={editingSong}
                    onClose={() => setEditingSong(null)}
                    onSave={loadSongs}
                />
            )}

            {removingSong && (
                <RemoveSongModal
                    song={removingSong}
                    onClose={() => setRemovingSong(null)}
                    onRemove={handleRemoveConfirm}
                />
            )}

            {addingSong && (
                <AddSongModal
                    onClose={() => setAddingSong(false)}
                    onAdd={loadSongs}
                />
            )}
        </div>
    );
};

export default SongsCatalogScreen;
