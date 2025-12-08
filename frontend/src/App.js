/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

// import the required libraries
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// import the necessary screen compoenents
import WelcomeScreen from './components/WelcomeScreen';
import EditAccountScreen from './components/EditAccountScreen';
import PlaylistsScreen from './components/PlaylistsScreen';
import SongsCatalogScreen from './components/SongsCatalogScreen';
import AppLayout from './components/AppLayout';

function App() {



    // provide routes to render each screen component in
    return (
        <Router>
            <Routes>
                <Route path="/" element={<WelcomeScreen />} />
                <Route
                    path="/create-account"
                    element={<Navigate to="/playlists" />}
                />
                <Route
                    path="/login"
                    element={<Navigate to="/playlists" /> }
                />
                <Route
                    path="/playlists"
                    element={
                        <AppLayout>
                            <PlaylistsScreen />
                        </AppLayout>
                    }
                />
                <Route
                    path="/songs"
                    element={
                        <AppLayout>
                            <SongsCatalogScreen />
                        </AppLayout>
                    }
                />
                <Route
                    path="/edit-account"
                    element={
                            <AppLayout>
                                <EditAccountScreen />
                            </AppLayout>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;