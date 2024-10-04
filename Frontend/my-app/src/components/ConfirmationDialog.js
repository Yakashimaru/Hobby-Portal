import React from 'react';
import '../styles/confirmationDialog.css';

const ConfirmationDialog = ({ message, onConfirm, onCancel }) => {
    // Split the message into lines
    const lines = String(message).split('\\n');

    return (
        <div className="confirmation-dialog">
            <div className="confirmation-dialog-content">
                <p>
                    {lines.map((line, index) => (
                        <React.Fragment key={index}>
                            {line}
                            {index < lines.length - 1 && <br />} {/* Add <br /> except for the last line */}
                        </React.Fragment>
                    ))}
                </p>
                <button className="confirmation-dialog-button" onClick={onConfirm}>Yes</button>
                <button className="confirmation-dialog-button" onClick={onCancel}>No</button>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
