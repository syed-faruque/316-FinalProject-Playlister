/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import React from 'react';

const DeletePlaylistModal = ({ playlist, onConfirm, onCancel }) => {
    // don't render the modal if the playlist is null
    if (!playlist) return null;

    // renders the modal
    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2 className="modal-title">Delete playlist?</h2>
                </div>
                <div className="modal-content">
                    <p className="modal-text-primary">
                        Are you sure you want to delete the "{playlist?.name}" playlist?
                    </p>
                    <p className="modal-text-secondary">
                        Doing so means it will be permanently removed.
                    </p>
                </div>
                <div className="modal-actions">
                    <button onClick={onConfirm} className="delete-button">Delete Playlist</button>
                    <button onClick={onCancel} className="cancel-button">Cancel</button>
                </div>

            </div>
        </div>
    );
};

export default DeletePlaylistModal;
