/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomeScreen = ({ user, onLogin }) => {
    const navigate = useNavigate();

    // event handlers to navigate to route based off user choice
    const handleContinueAsGuest = () => {
        navigate('/playlists');
    };
    const handleLogin = () => {
        navigate('/login');
    };
    const handleCreateAccount = () => {
        navigate('/create-account');
    };

    // if the user is already authenticated, he can go straight to playlists
    React.useEffect(() => {
        if (user) navigate('/playlists');
    }, [user, navigate]);

    // renders out the options
    return (
        <div className="welcome-screen">
            <div className="welcome-content">
                <h1 className="welcome-title">The Playlister</h1>
                <div className="welcome-buttons">
                    <button onClick={handleContinueAsGuest}>Continue as Guest</button>
                    <button onClick={handleLogin}>Login</button>
                    <button onClick={handleCreateAccount}>Create Account</button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
