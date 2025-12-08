/**
 * Syed Faruque
 * SBU-ID: 116340094
 */


// necessary library imports
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

// necessary modal imports
import EditSongModal from './modals/EditSongModal';
import RemoveSongModal from './modals/RemoveSongModal';
import AddSongModal from './modals/AddSongModal';

const SongsCatalogScreen = ({ user }) => {

    // all the states to keep track of
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
    const [editingSong, setEditingSong] = useState(null);
    const [removingSong, setRemovingSong] = useState(null);
    const [addingSong, setAddingSong] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [playlistMenuAnchor, setPlaylistMenuAnchor] = useState(null);
    const [loading, setLoading] = useState(true);
    const addToPlaylistMenuItemRef = useRef(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // loads the songs, only fetches playlist information if the user is authenticated
    useEffect(() => {
        loadSongs();
        if (user) {
            loadPlaylists();
        }
    }, [user]);


    // use effect hook to refilter and sort the songs catalog
    useEffect(() => {
        applyFiltersAndSort();
    }, [songs, filters, sortBy]);


    // sends the filtration data to the server and receives a response containing songs adhering to the filters
    const loadSongs = async () => {
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
    };


    // loads all the playlists from the server
    const loadPlaylists = async () => {
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
    };

    // filters and sorts the songs based off the filters and sort by states
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

    // updates the filter state whenever a change is made
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    // loads the songs whenever a search is done
    const handleSearch = () => {
        loadSongs();
    };


    // updates the filters' states to empty
    const handleClear = () => {
        setFilters({
            title: '',
            artist: '',
            year: '',
        });
        loadSongs();
    };

    // event handler for performing a search on an enter press, making it so the user doesn't have to click anything
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // when a song is clicked the selected song state is set and the song id is passed to the server to update its listens count
    const handleSongClick = async (song, event) => {
        if (event?.target?.closest('button') || event?.target?.closest('[role="button"]')) {
            return;
        }
        setSelectedSong(song);
        axios.post(`/api/songs/${song._id}/listen`).catch(console.error);
    };

    // handler to open the menu by updating its state
    const handleMenuOpen = (event, song) => {
        setMenuAnchor(event.currentTarget);
        setMenuSong(song);
    };

     // handler to close the menu by updating its state
    const handleMenuClose = () => {
        setMenuAnchor(null);
        setMenuSong(null);
        setPlaylistMenuAnchor(null);
    };

    // handles a press to the edit button by opening a modal
    const handleEdit = () => {
        if (menuSong && user && menuSong.owner._id === user._id) {
            setEditingSong(menuSong);
            handleMenuClose();
        }
    };

    // handles a press to the remove song button
    const handleRemove = () => {
        if (menuSong && user && menuSong.owner._id === user._id) {
            setRemovingSong(menuSong);
            handleMenuClose();
        }
    };

    // handles a press to add a new song to playlist
    const handleAddToPlaylist = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!user || !menuSong) return;
        await loadPlaylists();
        const anchorElement = addToPlaylistMenuItemRef.current || menuAnchor;
        if (anchorElement) {
            setPlaylistMenuAnchor(anchorElement);
        }
    };

    // handles clicking on a playlist in the dropdown menu in the songs catalog
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


    // handles a confirmation to remove the song. Ths should close the modal
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

    // checks if the user is an owener of a song
    const isOwner = (song) => {
        return user && song.owner._id === user._id;
    };

    // helper function that returns the youtube emebed link given the id
    const getYouTubeEmbedUrl = (youtubeId) => {
        return `https://www.youtube.com/embed/${youtubeId}`;
    };

    // sorts the playlist dropdown based off of the date updated
    const sortedPlaylists = [...playlists].sort((a, b) => {
        const dateА = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateА;
    });


    // renders the songs catalog, also renders existing modals
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
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="sort-select"
                            >
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
                            <span className="song-count">
                                {filteredSongs.length} Song{filteredSongs.length !== 1 ? 's' : ''}
                            </span>
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
                                            <div className="song-title">
                                                {song.title} by {song.artist} ({song.year})
                                            </div>
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
                            <button
                                onClick={() => setAddingSong(true)}
                                className="create-button"
                            >
                                New Song
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {menuAnchor && (
                <div className="song-menu">
                    {user && menuSong && (
                        <>
                            <div
                                ref={addToPlaylistMenuItemRef}
                                onClick={(e) => {
                                    handleAddToPlaylist(e);
                                }}
                                className="menu-item"
                            >
                                Add to Playlist
                            </div>
                            {isOwner(menuSong) && (
                                <>
                                    <div onClick={handleEdit} className="menu-item">
                                        Edit Song
                                    </div>
                                    <div onClick={handleRemove} className="menu-item">
                                        Remove from Catalog
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}

            {playlistMenuAnchor && (
                <div className="playlist-submenu">
                    {sortedPlaylists.length === 0 ? (
                        <div className="empty-menu">No playlists available</div>
                    ) : (
                        sortedPlaylists.map((playlist) => (
                            <div
                                key={playlist._id}
                                onClick={() => handlePlaylistSelect(playlist._id)}
                                className="submenu-item"
                            >
                                {playlist.name}
                            </div>
                        ))
                    )}
                </div>
            )}

            {editingSong && (
                <EditSongModal
                    song={editingSong}
                    onClose={() => {
                        setEditingSong(null);
                        loadSongs();
                    }}
                    onUpdate={loadSongs}
                />
            )}

            {removingSong && (
                <RemoveSongModal
                    song={removingSong}
                    onConfirm={handleRemoveConfirm}
                    onCancel={() => setRemovingSong(null)}
                />
            )}

            {addingSong && (
                <AddSongModal
                    onClose={() => {
                        setAddingSong(false);
                        loadSongs();
                    }}
                    onUpdate={loadSongs}
                />
            )}

            {snackbar.open && (
                <div className="snackbar">
                    <div className="snackbar-message">{snackbar.message}</div>
                    <button
                        onClick={() =>
                            setSnackbar({ open: false, message: '', severity: 'success' })
                        }
                        className="snackbar-close"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default SongsCatalogScreen;
