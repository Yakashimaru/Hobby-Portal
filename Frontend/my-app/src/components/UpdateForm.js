// To update record in the database

import React, { useState, useEffect } from 'react';
import formatColumnName from '../common/formatColumnName';
import formatUnderscoreName from '../common/formatting';
import '../styles/form.css';

const UpdateForm = ({ img, initialValues, showForm, onSubmit, onCloseForm }) => {
    
    const [formData, setFormData] = useState(initialValues || {}); // Initialize with initial values if provided

    // Update form data when initial values change
    useEffect(() => {
        setFormData(initialValues || {});
    }, [initialValues]);

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // Hide ID from field
    const formEntries = Object.entries(formData).slice(1);
    
    return (
        <>
            {showForm && (
                <div className="FormOverlay">
                    <div className="FormContainer">
                        <button className="CloseButton" onClick={() => onCloseForm()}>Close</button>
                        <div className="FormImage">
                            {/* <img src ={process.env.PUBLIC_URL + 
                                        `assets/images/visual_novel/${formatUnderscoreName(formData["game"])}.png`}
                                        alt="Visual Novel"
                            /> */}
                            <img src = {img} alt="Visual Novel"
                                className = {(img.includes("jpg") ? "img-jpg" : "img-png") }
                            />
                        </div>
                        <form onSubmit={handleSubmit} className="FormContent">
                            <div className="FormGrid">
                                {/* Render input fields for each column */}
                                {formEntries.map(([name, value], index) => (
                                    <div key={index} className="FormItem">
                                        <label htmlFor={name}>{formatColumnName(name)}</label>
                                        <input
                                            type="text"
                                            id={name}
                                            name={name}
                                            value={value || ''}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="SubmitButtonContainer">
                                <button type="submit" className="SubmitButton">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default UpdateForm;
