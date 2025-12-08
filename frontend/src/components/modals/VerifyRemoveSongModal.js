/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import React from 'react';

// the onconfirm and oncancel are hooks passed in to this modal component, they will execute in the song screen component
const VerifyRemoveSongModal = ({ song, onConfirm, onCancel }) => {
    if (!song) return null;

    // renders the modal with the confirmation message and button options
    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2 className="modal-title">Remove Song?</h2>
                </div>
                <div className="modal-content">
                    <p className="modal-text-primary">Are you sure you want to remove "{song?.title}" by {song?.artist} from this playlist?</p>
                    <p className="modal-text-secondary">Doing so will remove it from this playlist only.</p>
                </div>
                <div className="modal-actions">
                    <button onClick={onConfirm} className="delete-button">Remove Song</button>
                    <button onClick={onCancel} className="cancel-button">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default VerifyRemoveSongModal;
