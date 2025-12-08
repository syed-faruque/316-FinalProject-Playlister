/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AppLayout = ({ user, onLogout, children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // state that keeps track of whether or not to show the menu
    const [showMenu, setShowMenu] = useState(false);


    // event handlers for each navbar button

    // handles setting the menu show state to true, thereby causing the menu to show
    const handleProfileClick = () => {
        setShowMenu(!showMenu);
    };

    // handles setting the menu show state to false, thereby causing the menu to close
    const handleMenuClose = () => {
        setShowMenu(false);
    };

    // navigates to the welcome screen
    const handleHome = () => {
        navigate('/');
    };

    // navigates to the playlists catalog screen
    const handlePlaylists = () => {
        navigate('/playlists');
    };

    // naviagtes to the song catalog screen
    const handleSongs = () => {
        navigate('/songs');
    };

    // navigates to the login screen
    const handleLogin = () => {
        handleMenuClose();
        navigate('/login');
    };

    // navigates to the create account screen
    const handleCreateAccount = () => {
        handleMenuClose();
        navigate('/create-account');
    };

    // navigates to the edit account screen
    const handleEditAccount = () => {
        handleMenuClose();
        navigate('/edit-account');
    };

    // on logout it closes the menu and calls the onLogout hook, then it navigates back to the welcome screen
    const handleLogout = async () => {
        handleMenuClose();
        await onLogout();
        navigate('/', { replace: true });
    };

    // renders out the navigation bar
    return (
        <div className="app-layout">
            <div className="app-navbar">
                <div className="navbar-left">
                    <button onClick={handleHome}>Home</button>
                    <button onClick={handlePlaylists}>Playlists</button>
                    <button onClick={handleSongs}>Song Catalog</button>
                </div>

                <div className="navbar-title">The Playlister</div>

                <div className="navbar-right">
                    <button onClick={handleProfileClick} className="profile-button">
                        {user && user.avatar ? (
                            <img src={`data:image/png;base64,${user.avatar}`} alt="Avatar" />
                        ) : (
                            <span>User</span>
                        )}
                    </button>

                    {showMenu && (
                        <div className="profile-menu">
                            {user ? (
                                <>
                                    <button onClick={handleEditAccount}>Edit Account</button>
                                    <button onClick={handleLogout}>Logout</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={handleLogin}>Login</button>
                                    <button onClick={handleCreateAccount}>Create Account</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="app-content">
                {children}
            </div>
        </div>
    );
};

export default AppLayout;
