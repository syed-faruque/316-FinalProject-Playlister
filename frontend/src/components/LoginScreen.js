/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const LoginScreen = ({ onLogin }) => {
    const navigate = useNavigate();
    
    // states to hold onto
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // event handler for updating the form data state whenever a change is made
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    // sends the form data to the serverside and then navigates to playlists if the server verifies
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // posts the form data to the backend, and if verified, it navigates to playlists
            const response = await axios.post('/api/auth/login', formData);
            onLogin(response.data.user);
            navigate('/playlists');
        } 
        // if there is a verification error, the error state is set to depict an error message
        catch (error) {
            setError(error.response?.data?.error || 'Login failed. Please try again.');
        } 
        finally {
            setIsSubmitting(false);
        }
    };

    // renders the login form and error message
    return (
        <div className="login-screen">
            <h1 className="login-title">Sign In</h1>
            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-field">
                    <label>Email</label>
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-field">
                    <label>Password</label>
                    <input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    {error && <div className="error-message">{error}</div>}
                </div>
                <button
                    type="submit"
                    disabled={!formData.email || !formData.password || isSubmitting}
                    className="submit-button"
                >
                    Sign In
                </button>
            </form>
            <div className="login-footer">
                Don't have an account? <Link to="/create-account">Sign Up</Link>
            </div>
        </div>
    );
};

export default LoginScreen;
