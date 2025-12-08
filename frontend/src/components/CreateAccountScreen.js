/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const CreateAccountScreen = () => {
    const navigate = useNavigate();

    // states to keep track of form data, errors, avatars, and submission process
    const [formData, setFormData] = useState({
        userName: '',
        email: '',
        password: '',
        passwordConfirm: '',
        avatar: null,
    });
    const [errors, setErrors] = useState({});
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // update the form data whenever a change is made
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // update the avatar state
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // checks file size of the uploaded image
            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, avatar: 'Image size must be less than 2MB' }));
                return;
            }

            // uses FileReader to showcase the image src
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setAvatarPreview(event.target.result);
                    setFormData(prev => ({ ...prev, avatar: event.target.result }));
                    setErrors(prev => ({ ...prev, avatar: '' }));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    // checks if the entered form values are valid
    const validateForm = () => {
        const newErrors = {};

        if (!formData.userName.trim()) {
            newErrors.userName = 'User name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } 
        else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } 
        else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!formData.passwordConfirm) {
            newErrors.passwordConfirm = 'Please confirm your password';
        } 
        else if (formData.password !== formData.passwordConfirm) {
            newErrors.passwordConfirm = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    // if form inputs are valid, the data gets sent over to the server, then the response is received and handled
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        // sends request containing form data to server
        try {
            // if the server verifies, navigate to the login page
            await axios.post('/api/auth/register', formData);
            navigate('/login');
        } 
        // if the server returns an error, set the error state to show the error message
        catch (error) {
            if (error.response?.data?.field) {
                setErrors(prev => ({
                    ...prev,
                    [error.response.data.field]: error.response.data.error,
                }));
            } 
            else {
                setErrors(prev => ({
                    ...prev,
                    general: error.response?.data?.error || 'Failed to create account',
                }));
            }
        } 
        finally {
            setIsSubmitting(false);
        }
    };

    // basic checks to see if the form is valid
    const isFormValid =
        formData.userName.trim() &&
        formData.email.trim() &&
        formData.password.length >= 8 &&
        formData.password === formData.passwordConfirm &&
        !Object.values(errors).some(err => err);

    // renders out the form, errors, and the avatar
    return (
        <div className="create-account-screen">
            <h1 className="create-account-title">Create Account</h1>
            <form onSubmit={handleSubmit} className="create-account-form">
                <div className="avatar-section">
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" className="avatar-preview" />
                    ) : (
                        <div className="avatar-placeholder">No avatar</div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        id="avatar-upload"
                        className="avatar-input"
                    />
                    <label htmlFor="avatar-upload">
                        <button type="button">Select</button>
                    </label>
                    {errors.avatar && <div className="error-message">{errors.avatar}</div>}
                </div>

                <div className="form-field">
                    <label>User Name</label>
                    <input
                        name="userName"
                        value={formData.userName}
                        onChange={handleChange}
                    />
                    {errors.userName && <div className="error-message">{errors.userName}</div>}
                </div>

                <div className="form-field">
                    <label>Email</label>
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    {errors.email && <div className="error-message">{errors.email}</div>}
                </div>

                <div className="form-field">
                    <label>Password</label>
                    <input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    {errors.password && <div className="error-message">{errors.password}</div>}
                </div>

                <div className="form-field">
                    <label>Password Confirm</label>
                    <input
                        name="passwordConfirm"
                        type="password"
                        value={formData.passwordConfirm}
                        onChange={handleChange}
                    />
                    {errors.passwordConfirm && <div className="error-message">{errors.passwordConfirm}</div>}
                </div>

                <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className="submit-button"
                >
                    Create Account
                </button>
            </form>

            <div className="create-account-footer">
                Already have an account? <Link to="/login">Sign In</Link>
            </div>
        </div>
    );
};

export default CreateAccountScreen;
