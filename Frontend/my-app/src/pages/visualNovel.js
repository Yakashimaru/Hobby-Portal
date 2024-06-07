import React, { useState, useEffect } from "react";

import retrieveDatabase from "../common/retrieveDatabase";
import editDatabase from "../common/editDatabase";
import formatColumnName from "../common/formatColumnName";
import formatUnderscoreName from "../common/formatUnderscoreName";
import formatScrappedDate from "../common/formatScrappedDate";

import Form from "../components/Form";

import "../styles/table.css";
import "../styles/form.css";
import { api_paths, initial_url } from "../settings/databaseSettings";
import { vn_update_url, initial_vn_url } from "../settings/vnWebsite";

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
    //const hiddenColumns = ["Year","Developer","Genre 1","Genre 2","Story","Renders","Animations","Scenes"]
    //const hiddenColumnsIndex = [1, 2, 3, 4, 5, 6, 7, 8];
    // Table Name
    const table_name = "VisualNovel";  
    const [sortField, setSortField] = useState("");
    const [order, setOrder] = useState("asc");
    // For API update
    const [filteredData, setFilteredData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const url_path = `getVisualNovel`;
                const data = await retrieveDatabase(url_path);
                
                // Exclude column 0 from columns
                //const columns = data.columns.slice(1);

                // Exclude column 0 from each row
                //const rows = data.rows.map(row => row.slice(1));

                // Set the modified tableData in the state
                //setTableData({ columns, rows });
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

    const getColumnValuesByCondition = (data, targetColumnIndex, conditionColumnIndex, conditionValue) => {
        return data
            .filter(row => row[conditionColumnIndex] === conditionValue)
            .map(row => row[targetColumnIndex]);
    };    
    
    const handleUpdatesClick = async () => {
        const values = getColumnValuesByCondition(tableData.rows, 1, 16, 'Ongoing');
        const data_updated = {};

        setFilteredData(values);

        for (const value of values) {
            let response_data = await updateVisualNovelDates(value);
                if (response_data["code"] == "200"){
                    data_updated[value] = "Success";

                    //Write to database
                    let date = response_data["data"];
                    let data_formatted = formatScrappedDate(date);
                    let path = initial_url + "updateUserVisualNovel";
                    let data = {
                        "game": value,
                        "last_updated": data_formatted,
                    };
                    const response = await fetch(path, {
                        method: 'PUT',  
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    });
                    const responseData = await response.json();
                    console.log('Response from server:', responseData);
                }
                else{
                    data_updated[value] = "Failed";
                }
        }

        console.log("Data updated: ",data_updated)
    };

    function generateRandom(min, max, step) {
        const randomNum = min + Math.random() * (max - min);
        return Math.round(randomNum / step) * step;
    };

    const updateVisualNovelDates = async (game_name) => {
        let game_name_formatted = game_name.trim().replaceAll(" ", "-");
        const path = initial_vn_url + "getVNDate";
        const data_url = vn_update_url + game_name_formatted + "/";
        const data = {"url": data_url};
        
        try {
            const response = await fetch(path, {
                method: 'POST',  
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const responseData = await response.json();
            console.log('Response from server:', responseData);
            return responseData;

        } catch (error) {
            console.error('Error adding new entry:', error);
            return { status: "500", message: error.toString() };  // Return a consistent error response
        }
    };

    // Toggle column visibility
    const handleUnhideInfoClick = () => {
        console.log("Toggle columns visibility");
        setShowColumns(!showColumns);
    };

    const handleSorting = (sortField, sortOrder) => {
        if (sortField) {
            const sorted = [...tableData].sort((a, b) => {
                if (a[sortField] === null) return 1;
                if (b[sortField] === null) return -1;
                if (a[sortField] === null && b[sortField] === null) return 0;
                return (
                    a[sortField].toString().localeCompare(b[sortField].toString(), "en", {
                    numeric: true,
                    }) * (sortOrder === "asc" ? 1 : -1)
                );
            });
            setTableData(sorted);
        }
    };

    const handleSortingChange = (columnName) => {
        const sortOrder =
            columnName === sortField && order === "asc" ? "desc" : "asc";
        setSortField(columnName);
        setOrder(sortOrder);
        handleSorting(columnName, sortOrder);
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
                                    <th key={columnName} onClick={() => handleSortingChange(columnName)}>{formatColumnName(columnName)}</th>
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
                                        <td key={cellIndex}>
                                            {/* Render image for specific columns */}
                                            {(cellIndex === 0 ) &&
                                            <div>
                                                <img src={process.env.PUBLIC_URL + 
                                                    `assets/images/visual_novel/${formatUnderscoreName(row[1])}.png`} 
                                                    alt="" />
                                                <br />
                                                <span className = "game_title">{cell}</span>
                                            </div>
                                            }
                                            {(cellIndex >= 10 && cellIndex <= 12) &&
                                                <div>
                                                    <img src={process.env.PUBLIC_URL +
                                                        `assets/images/visual_novel/${formatUnderscoreName(row[1] + 
                                                        " " +
                                                        row[cellIndex + 1])}.png`} 
                                                        alt="" 
                                                        width="177" height="100"/>
                                                    <br />
                                                    <span className = "favourites">{cell}</span>
                                                </div>
                                            }
                                            {/* Render other cells */}
                                            {(cellIndex !== 0 && !(cellIndex >= 10 && cellIndex <= 12)) &&
                                                <div>
                                                    {cell}
                                                </div>
                                            }
                                        </td>
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
