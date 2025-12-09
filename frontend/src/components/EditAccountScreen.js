/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Edit account screen component
const EditAccountScreen = ({ user, onUpdate }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        userName: user?.userName || '',
        password: '',
        passwordConfirm: '',
        avatar: user?.avatar || null,
    });
    const [errors, setErrors] = useState({});
    const [avatarPreview, setAvatarPreview] = useState(
        user?.avatar ? `data:image/png;base64,${user.avatar}` : null
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update formData when user prop changes
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                userName: user.userName || '',
                avatar: user.avatar || null,
            }));
            setAvatarPreview(
                user.avatar ? `data:image/png;base64,${user.avatar}` : null
            );
        }
    }, [user]);

    // Handles typing into inputs and clears field errors
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Handles avatar file selection, validation, and preview/base64 extraction
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, avatar: 'Image size must be less than 2MB' }));
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const dataUrl = event.target.result;
                    setAvatarPreview(dataUrl);
                    // Extract just the base64 part (remove "data:image/...;base64," prefix)
                    const base64String = dataUrl.split(',')[1];
                    setFormData(prev => ({ ...prev, avatar: base64String }));
                    setErrors(prev => ({ ...prev, avatar: '' }));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    // Validates the form fields and sets errors
    const validateForm = () => {
        const newErrors = {};

        if (!formData.userName.trim()) {
            newErrors.userName = 'User name is required';
        }

        if (formData.password || formData.passwordConfirm) {
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
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submits updated account data to the server
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Prepare data to send - ensure avatar is sent even if null/empty
            const updateData = {
                userName: formData.userName,
                avatar: formData.avatar || '',
            };

            // Only include password fields if they're being changed
            if (formData.password && formData.passwordConfirm) {
                updateData.password = formData.password;
                updateData.passwordConfirm = formData.passwordConfirm;
            }

            const response = await axios.put('/api/users/me', updateData);
            // Update the user state with the response
            onUpdate(response.data.user);
            navigate(-1);
        } 
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
                    general: error.response?.data?.error || 'Failed to update account',
                }));
            }
        } 
        finally {
            setIsSubmitting(false);
        }
    };

    // Cancels editing and navigates back
    const handleCancel = () => {
        navigate(-1);
    };

    // Normalizes avatar values for comparison
    const normalizeAvatar = (avatar) => avatar || '';

    const hasChanges =
        formData.userName !== user?.userName ||
        normalizeAvatar(formData.avatar) !== normalizeAvatar(user?.avatar) ||
        (formData.password && formData.passwordConfirm);

    const isFormValid =
        formData.userName.trim() &&
        (!formData.password || (formData.password.length >= 8 && formData.password === formData.passwordConfirm)) &&
        !Object.values(errors).some(err => err);

    return (
        <div className="edit-account-screen">
            <h1 className="edit-account-title">Edit Account</h1>
            <form onSubmit={handleSubmit} className="edit-account-form">
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
                        value={user?.email || ''}
                        disabled
                    />
                    <div className="helper-text">Email cannot be changed</div>
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
                    {!errors.password && <div className="helper-text">Leave blank to keep current password</div>}
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
                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={!isFormValid || !hasChanges || isSubmitting}
                        className="submit-button"
                    >
                        Complete
                    </button>
                    <button type="button" onClick={handleCancel} className="cancel-button">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditAccountScreen;
