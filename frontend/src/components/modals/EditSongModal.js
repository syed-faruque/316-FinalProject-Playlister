/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditSongModal = ({ song, onClose, onUpdate }) => {
    // handles clearing the input fields by setting the form states to empty strings
    const handleClear = (field) => {
        setFormData(prev => ({ ...prev, [field]: '' }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // state to keep track of the form
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        year: '',
        youtubeId: '',
    });

    // state to keep track of errors
    const [errors, setErrors] = useState({});

    // initializes the form with the song data when the song is available
    useEffect(() => {
        if (song) {
            setFormData({
                title: song.title || '',
                artist: song.artist || '',
                year: song.year?.toString() || '',
                youtubeId: song.youtubeId || '',
            });
        }
    }, [song]);

    // updates the form state whenever the user changes the form
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // small checks to see if the form inputs are valid
    const isFormValid = 
        formData.title.trim() &&
        formData.artist.trim() &&
        formData.year &&
        formData.youtubeId.trim();

    // sends the updated song data to the serverside so that it updates on the backend
    const handleSubmit = async () => {
        if (!song) return;

        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.artist.trim()) newErrors.artist = 'Artist is required';
        if (!formData.year) newErrors.year = 'Year is required';
        if (!formData.youtubeId.trim()) newErrors.youtubeId = 'YouTube ID is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        // sends a request containing the form data to the server
        try {
            await axios.put(`/api/songs/${song._id}`, formData);
            if (onUpdate) onUpdate();
            onClose();
        } 
        // handles any error the server returns
        catch (error) {
            console.error('Failed to update song:', error);
            if (error.response?.data?.error) {
                setErrors({ general: error.response.data.error });
            }
        }
    };

    if (!song) return null;

    // renders the modal
    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2 className="modal-title">Edit Song</h2>
                </div>
                <div className="modal-content">
                    <div className="form-field">
                        <label>Title</label>
                        <div className="input-wrapper">
                            <input
                                name="title"
                                type="text"
                                value={formData.title}
                                onChange={handleChange}
                            />
                            {formData.title && (
                                <button type="button" onClick={() => handleClear('title')} className="clear-button">✕</button>
                            )}
                        </div>
                        {errors.title && <div className="error-message">{errors.title}</div>}
                    </div>
                    <div className="form-field">
                        <label>Artist</label>
                        <div className="input-wrapper">
                            <input
                                name="artist"
                                type="text"
                                value={formData.artist}
                                onChange={handleChange}
                            />
                            {formData.artist && (
                                <button type="button" onClick={() => handleClear('artist')} className="clear-button">✕</button>
                            )}
                        </div>
                        {errors.artist && <div className="error-message">{errors.artist}</div>}
                    </div>
                    <div className="form-field">
                        <label>Year</label>
                        <div className="input-wrapper">
                            <input
                                name="year"
                                type="number"
                                value={formData.year}
                                onChange={handleChange}
                            />
                            {formData.year && (
                                <button type="button" onClick={() => handleClear('year')} className="clear-button">✕</button>
                            )}
                        </div>
                        {errors.year && <div className="error-message">{errors.year}</div>}
                    </div>
                    <div className="form-field">
                        <label>YouTube Id</label>
                        <div className="input-wrapper">
                            <input
                                name="youtubeId"
                                type="text"
                                value={formData.youtubeId}
                                onChange={handleChange}
                            />
                            {formData.youtubeId && (
                                <button type="button" onClick={() => handleClear('youtubeId')} className="clear-button">✕</button>
                            )}
                        </div>
                        {errors.youtubeId && <div className="error-message">{errors.youtubeId}</div>}
                    </div>
                </div>
                <div className="modal-actions">
                    <button onClick={handleSubmit} disabled={!isFormValid} className="submit-button">Complete</button>
                    <button onClick={onClose} className="cancel-button">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default EditSongModal;
