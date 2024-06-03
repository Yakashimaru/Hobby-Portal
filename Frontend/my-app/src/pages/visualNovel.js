import React, { useState, useEffect } from "react";

import retrieveDatabase from "../common/retrieveDatabase";
import editDatabase from "../common/editDatabase";
import formatColumnName from "../common/formatColumnName";
import formatScrappedDate from "../common/formatScrappedDate";

import Form from "../components/Form";

import "../styles/table.css";
import "../styles/form.css";
import { api_paths, initial_url } from "../settings/databaseSettings";

const Vntable = () => {
    // State to store the table data
    const [tableData, setTableData] = useState({ columns: [], rows: [] });
    // Display loading if data is not yet fetched
    const [loading, setLoading] = useState(true);
    // Form state
    const [showForm, setShowForm] = useState(false);
    // State to toggle column visibility
    const [showColumns, setShowColumns] = useState(false); 
    // Columns to be hidden/unhidden
    const hiddenColumns = ["Year","Developer","Genre 1","Genre 2","Story","Renders","Animations","Scenes"]
    const hiddenColumnsIndex = [1, 2, 3, 4, 5, 6, 7, 8];
    // Table Name
    const table_name = "VisualNovel";  

    useEffect(() => {
        const fetchData = async () => {
            try {
                const url_path = `getVisualNovel`;
                const data = await retrieveDatabase(url_path);
                
                setTableData(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
    
        fetchData(); // Fetch data immediately on component mount
    
        // Clear tableData state when table_name changes
        return () => {
            //console.log("Clearing tableData state");
            setTableData({ columns: [], rows: [] });
        };
    }, [table_name]);

    //Form functions
    const handleNewEntryClick = () => {
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
    };

    const handleSubmit = (formData) => {
        //console.log(table_name)
        let key = "C" + table_name
        const path = initial_url + api_paths[key];
        console.log(path);
        fetch(path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Response from server:', data);
            setShowForm(false);
        })
        .catch(error => {
            console.error('Error adding new entry:', error);
        });
    };

    
    const handleUpdatesClick = () => {
        
    };

    // Toggle column visibility
    const handleUnhideInfoClick = () => {
        console.log("Toggle columns visibility");
        setShowColumns(!showColumns);
    };
    
    //Display loading if data is not yet fetched
    if (loading){
        return <div>Loading...</div>;
    }

    //Return the table
    return (
        <div className="TableContainer">
        <button className="NewEntryButton" onClick={handleNewEntryClick}>Enter new entry</button>
        <button className="unhideInfo" onClick={handleUnhideInfoClick}>
            {showColumns ? 'Hide Information' : 'Show More Information'}
        </button>
        <button className="getUpdatesButton" onClick={handleUpdatesClick}>Get Updates</button>

            <div className="Table">
                <table>
                    <thead>
                        <tr>
                            {tableData.columns.slice(1).map((columnName, columnIndex) => (
                                ((!showColumns && columnIndex > 0 && columnIndex < 9) ? null : (
                                    <th key={columnName}>{formatColumnName(columnName)}</th>
                                ))
                            ))}
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.slice(1).map((cell, cellIndex) => (
                                    ((!showColumns && cellIndex > 0 && cellIndex < 9) ? null : (
                                        <td key={cellIndex}>{cell}</td>
                                    ))
                                ))}
                                <td>
                                    <button onClick={() => editDatabase(row)}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Form
                table_name={table_name}
                columns={tableData.columns}
                showForm={showForm}
                onCloseForm={handleCloseForm}
                onSubmit={handleSubmit}
            />
        </div>
    );
}

export default Vntable;
