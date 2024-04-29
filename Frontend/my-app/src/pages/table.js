import React, { useState, useEffect } from "react";

import retrieveDatabase from "../functions/retrieveDatabase";

import "./table.css";

//function Table() {
const Table = () => {
    const [figurineData, setFigurineData] = useState({ columns: [], rows: [] });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await retrieveDatabase("getFigurine");
                console.log(data)
                setFigurineData(data);
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

    return (
        <div className="Table">
            <table>
                <thead>
                    <tr>
                        {figurineData.columns.map((columnName, columnIndex) => (
                            <th key={columnIndex}>{formatColumnName(columnName)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {figurineData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
