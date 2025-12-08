/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import React, { useState } from 'react';
import axios from 'axios';

const AddSongModal = ({ onClose, onUpdate }) => {

    // state to keep track of the input fields
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        year: '',
        youtubeId: '',
    });

    // state to keep track of any validation or server errors
    const [errors, setErrors] = useState({});

    // clears the input field and associated error when user clicks the clear button
    const handleClear = (field) => {
        setFormData(prev => ({ ...prev, [field]: '' }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // updates formData whenever user types into an input field
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // validates inputs and sends a request to add a new song to the server
    const handleSubmit = async () => {
        const newErrors = {};

        // check for required fields
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.artist.trim()) newErrors.artist = 'Artist is required';
        if (!formData.year) newErrors.year = 'Year is required';
        if (!formData.youtubeId.trim()) newErrors.youtubeId = 'YouTube ID is required';

        // if there are validation errors, display them and stop submission
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            // send form data to the backend to create a new song
            await axios.post('/api/songs', formData);

            // call onUpdate hook to refresh parent component if provided
            if (onUpdate) onUpdate();

            // close the modal after successful submission
            onClose();
        } 
        catch (error) {
            console.error('Failed to add song:', error);
            // display server error if available
            if (error.response?.data?.error) {
                setErrors({ general: error.response.data.error });
            }
        }
    };

    // checks if all required inputs are filled for enabling the submit button
    const isFormValid =
        formData.title.trim() &&
        formData.artist.trim() &&
        formData.year &&
        formData.youtubeId.trim();

    // renders the modal with form inputs, clear buttons, and error messages
    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2 className="modal-title">Add Song</h2>
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

export default AddSongModal;
