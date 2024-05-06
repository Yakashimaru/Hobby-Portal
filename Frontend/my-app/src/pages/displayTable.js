import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import retrieveDatabase from "../common/retrieveDatabase";

import "../styles/table.css";
import editDatabase from "../common/editDatabase";

//function Table() {
const Table = () => {
    const [tableData, setTableData] = useState({ columns: [], rows: [] });
    //Display loading if data is not yet fetched
    const [loading, setLoading] = useState(true);
    //Get the table name from the URL
    const { table_name } = useParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (table_name) { // Check if table_name is not null or undefined
                    const url_path = `get${table_name.charAt(0).toUpperCase()}${table_name.slice(1)}`;
                    const data = await retrieveDatabase(url_path);
                    
                    console.log("Fetched data:", data); // Log fetched data
                    
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
    

    const formatColumnName = (columnName) => {
        return columnName
            .replace(/_/g, ' ') // Replace underscores with spaces
            .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
    };

    if (loading){
        return <div>Loading...</div>;
    }

    return (
        <div>
            
            <div className="Table">
                <table>
                    <thead>
                        <tr>
                            <th>Image</th>
                            {tableData.columns.slice(1).map((columnName, columnIndex) => (
                                <th key={tableData.rows[0][columnIndex + 1]}>{formatColumnName(columnName)}</th>
                            ))}
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                <td><img src={row[0]} alt="TBA" /></td>
                                {row.slice(1).map((cell, cellIndex) => (
                                    <td key={tableData.rows[0][cellIndex + 1]}>{cell}</td>
                                ))}
                                <td>
                                    <button onClick={() => editDatabase(row)}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Table;
