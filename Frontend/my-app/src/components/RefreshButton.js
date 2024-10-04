import React, { useState } from 'react';
import '../styles/refreshButton.css';
import ConfirmationDialog from './ConfirmationDialog';

const RefreshButton = ({ onClick, message, showConfirmation = true}) => {
    const [iconClass, setIconClass] = useState('fa');
    const [showDialog, setShowDialog] = useState(false);

    const handleConfirm = async () => {
        setShowDialog(false); // Close the dialog
        setIconClass('fa fa-spin');
        await onClick(); // Execute the passed-in onClick function
        setIconClass('fa'); // Reset the icon class after the function completes
    };

    const handleCancel = () => {
        setShowDialog(false); // Close the dialog
        // Optionally handle cancel logic
    };

    const handleClick = async () => {
        if (showConfirmation) {
            setShowDialog(true);
        } else {
            onClick();
        }
    };

    return (
        <div>
            <button className="refresh-button" onClick={handleClick}>
                <i style={{ fontSize: '24px' }} className={iconClass}>&#xf021;</i>
            </button>
            {showDialog && (
                <ConfirmationDialog
                    message={message}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
    
};

export default RefreshButton;
