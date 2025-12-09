/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

// import the required libraries
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// import the CSS styles
import './App.css';

// import the necessary screen compoenents
import WelcomeScreen from './components/WelcomeScreen';
import CreateAccountScreen from './components/CreateAccountScreen';
import LoginScreen from './components/LoginScreen';
import EditAccountScreen from './components/EditAccountScreen';
import PlaylistsScreen from './components/PlaylistsScreen';
import SongsCatalogScreen from './components/SongsCatalogScreen';
import AppLayout from './components/AppLayout';

function App() {
    
    // states storing the user data and whether or not the page should load
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // instantly calls checkSession
    useEffect(() => {
        checkSession();
    }, []);

    // sends a request to the server to see if the current user is already logged into a session
    const checkSession = async () => {
        try {
            const response = await axios.get('/api/auth/session');
            if (response.data.authenticated) {
                const userResponse = await axios.get('/api/users/me');
                setUser(userResponse.data);
            }
        } 
        catch (error) {
            console.error('Session check failed:', error);
        } 
        finally {
            setLoading(false);
        }
    };

    // function for setting the state of the user data once the user logs in
    const handleLogin = (userData) => {
        setUser(userData);
    };


    // event handler for when logout button is pressed
    const handleLogout = async () => {
        try {
            await axios.post('/api/auth/logout');
            setUser(null);
        } 
        catch (error) {
            console.error('Logout failed:', error);
            setUser(null);
        }
    };


    // returns a loading message if the checkSession has not finished
    if (loading) return <div>Loading...</div>;


    // provide routes to render each screen component in
    return (
        <Router>
            <Routes>
                <Route path="/" element={<WelcomeScreen user={user} onLogin={handleLogin} />} />
                <Route
                    path="/create-account"
                    element={user ? <Navigate to="/playlists" /> : <CreateAccountScreen />}
                />
                <Route
                    path="/login"
                    element={user ? <Navigate to="/playlists" /> : <LoginScreen onLogin={handleLogin} />}
                />
                <Route
                    path="/playlists"
                    element={
                        <AppLayout user={user} onLogout={handleLogout}>
                            <PlaylistsScreen user={user} />
                        </AppLayout>
                    }
                />
                <Route
                    path="/songs"
                    element={
                        <AppLayout user={user} onLogout={handleLogout}>
                            <SongsCatalogScreen user={user} />
                        </AppLayout>
                    }
                />
                <Route
                    path="/edit-account"
                    element={
                        user ? (
                            <AppLayout user={user} onLogout={handleLogout}>
                                <EditAccountScreen user={user} onUpdate={setUser} />
                            </AppLayout>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;