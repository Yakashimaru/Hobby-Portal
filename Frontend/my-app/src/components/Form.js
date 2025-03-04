import React, { useState } from 'react';

import formatColumnName from '../common/formatColumnName';

const Form = ({ table_name, columns, showForm, onCloseForm, onSubmit }) => {
    const [formData, setFormData] = useState({});

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form data:', formData);
        onSubmit(formData);
    };

    return (
        <>
            {showForm && (
                <div className="FormOverlay">
                    <div className="FormContainer">
                        <button className="CloseButton" onClick={onCloseForm}>Close</button>
                        <form onSubmit={handleSubmit}>
                            {/* Render input fields for each column */}
                            {columns.slice(1).map((columnName, columnIndex) => (
                                <div key={columnIndex}>
                                    <label htmlFor={columnName}>{formatColumnName(columnName)  + "  "}</label>

                                    {/* Check if the column is "status" to render dropdown */}
                                    {columnName === 'status' ? (
                                        <select
                                            id={columnName}
                                            name={columnName}
                                            onChange={handleInputChange}
                                            value={formData[columnName] || 'Ongoing'}
                                        >
                                            <option value="Ongoing">Ongoing</option>
                                            <option value="Soon">Soon</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Dropped">Dropped</option>
                                            <option value="Abandoned">Abandoned</option>
                                        </select>
                                    ) : (
                                    <input
                                        type="text"
                                        id={columnName}
                                        name={columnName}
                                        onChange={handleInputChange}
                                    />
                                    )}
                                </div>
                            ))}
                            <button type="submit">Submit</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Form;
