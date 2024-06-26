import React from 'react';
import '../styles/confirmationDialog.css';

const ConfirmationDialog = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="confirmation-dialog">
            <div className="confirmation-dialog-content">
                <p>{message}</p>
                <button className="confirmation-dialog-button" onClick={onConfirm}>Yes</button>
                <button className="confirmation-dialog-button" onClick={onCancel}>No</button>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
