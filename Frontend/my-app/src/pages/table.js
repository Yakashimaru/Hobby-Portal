import React, { useState, useEffect } from "react";

import retrieveDatabase from "../common/retrieveDatabase";

import "../styles/table.css";
import editDatabase from "../common/editDatabase";

//function Table() {
const Table = () => {
    const [figurineData, setFigurineData] = useState({ columns: [], rows: [] });
    const [loading, setLoading] = useState(true);

    let tracker = false;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await retrieveDatabase("getFigurine");
                //console.log(data)
                setFigurineData(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching figurine data:', error);
            }
        };
        fetchData();
    }, []);

    const formatColumnName = (columnName) => {
        return columnName
            .replace(/_/g, ' ') // Replace underscores with spaces
            .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
    };

    if (loading){
        return <div>Loading...</div>;
    }
    return (
        <div className="Table">
            <table>
                <thead>
                    <tr>
                        <th>Image</th>
                        {figurineData.columns.map((columnName, columnIndex) => (
                            <th key={columnIndex}>{formatColumnName(columnName)}</th>
                        ))}
                        <th>Edit</th>
                    </tr>
                </thead>
                <tbody>
                    {figurineData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            <td><img src={row[0]} alt="TBA" /></td>
                            <td>{row[0]}</td>
                            {row.slice(1).map((cell, cellIndex) => (
                                <td key={cellIndex + 1}>{cell}</td>
                            ))}
                            <td>
                                <button onClick={() => editDatabase(row)}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
