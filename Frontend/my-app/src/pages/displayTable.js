import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import retrieveDatabase from "../common/retrieveDatabase";
import editDatabase from "../common/editDatabase";
import formatColumnName from "../common/formatColumnName";

import Form from "../components/Form";

import "../styles/table.css";
import "../styles/form.css";
import { api_paths, initial_url } from "../settings/databaseSettings";

//function Table() {
const Table = () => {
    const [tableData, setTableData] = useState({ columns: [], rows: [] });
    //Display loading if data is not yet fetched
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    //Get the table name from the URL
    const { table_name } = useParams();
    

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (table_name) { // Check if table_name is not null or undefined
                    const url_path = `get${table_name.charAt(0).toUpperCase()}${table_name.slice(1)}`;
                    const data = await retrieveDatabase(url_path);
                    
                    setTableData(data);
                    setLoading(false);
                }
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
        let key = "C"+table_name
        const path = initial_url+api_paths[key];
        console.log(path)
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
    
    if (loading){
        return <div>Loading...</div>;
    }

    return (
        <div className="TableContainer">
        <button className="NewEntryButton" onClick={handleNewEntryClick}>Enter new entry</button>
            <div className="Table">
                <table>
                    <thead>
                        <tr>
                            <th>Image</th>
                            {tableData.columns.slice(1).map((columnName, columnIndex) => (
                                <th >{formatColumnName(columnName)}</th>
                            ))}
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                <td><img src={row[0]} alt="TBA" /></td>
                                {row.slice(1).map((cell, cellIndex) => (
                                    <td >{cell}</td>
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

export default Table;
