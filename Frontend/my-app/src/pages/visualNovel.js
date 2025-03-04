import React, { useState, useEffect } from "react";

// From common folder
import retrieveDatabase from "../common/retrieveDatabase";
import formatColumnName from "../common/formatColumnName";
import {formatUnderscoreName, removeSpecialCharacters} from "../common/formatting";
import formatScrappedDate from "../common/formatScrappedDate";
import fetchRequest from "../common/fetchRequest";
import getCurrentDate from "../common/getCurrentDate";

// From components folder
import Form from "../components/Form";
import UpdateForm from "../components/UpdateForm";
import Spinner from "../components/Spinner";
import RefreshButton from "../components/RefreshButton";

// From styles folder
import "../styles/table.css";
import "../styles/form.css";
import "../styles/visualNovel.css";

// From settings folder
import { api_paths, initial_url } from "../settings/databaseSettings";
import { vn_update_url, initial_vn_url } from "../settings/vnWebsite";


const Vntable = () => {
    // State to store the table data
    const [tableData, setTableData] = useState({ columns: [], rows: [] });
    // Display loading if data is not yet fetched
    const [loading, setLoading] = useState(true);
    // Loading state for get updates
    const [updating, setUpdating] = useState(false);
    // Form state
    const [showForm, setShowForm] = useState(false);
    // State to toggle column visibility
    const [showColumns, setShowColumns] = useState(false); 
    const [sortField, setSortField] = useState("");
    const [order, setOrder] = useState("asc");
    // For API update
    const [filteredData, setFilteredData] = useState([]);
    // For edit form
    const [rowDataForEdit, setRowDataForEdit] = useState(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [imageClass, setImageClass] = useState("game_image");
    const [gamesUpdated, setGamesUpdated] = useState([]);
    const [img, setImg] = useState("");
    const [gamesToPlay, setGamesToPlay] = useState([]);

    // Variables
    const table_name = "VisualNovel";  

    async function refresh_data(){
        const url_path = `getVisualNovel`;
        const data = await retrieveDatabase(url_path);
        
        setTableData(data);
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                await refresh_data();
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

    useEffect(() => {
        const parseDate = (dateString) => {
            if (!dateString) {
                return null;
            }
            const [day, month, year] = dateString.split('/').map(Number);
            return new Date(year, month - 1, day);
        };

        // To check if the an image url exists
        const checkImage = (url) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = url;
            });
        };

        // Function to display "Games Updated"
        const updateGamesToPlayStatus = async () => {
            if (tableData.rows.length > 0) {
                let games = [];
                for (const row of tableData.rows) {
                    const last_played_date = parseDate(row[14]);
                    const last_updated_date = parseDate(row[15]);
                    if (last_updated_date > last_played_date) {
                        const jpgUrl = `${process.env.PUBLIC_URL}/assets/images/visual_novel/${formatUnderscoreName(row[1])}.jpg`;
                        const pngUrl = `${process.env.PUBLIC_URL}/assets/images/visual_novel/${formatUnderscoreName(row[1])}.png`;
                        const jpgExists = await checkImage(jpgUrl);
                        const imgUrl = jpgExists ? jpgUrl : pngUrl;
                        games.push(imgUrl);
                    }
                }
            setGamesToPlay(games);
            }
        };

        updateGamesToPlayStatus();
    }, [tableData]);

    //Form functions
    const handleNewEntryClick = () => {
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
    };

    // const handleSubmit = (formData) => {
    //     // let key = "C" + table_name
    //     const path = initial_url + "addvisualnovel";

    //     fetch(path, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify(formData),
    //     })
    //     .then(response => response.json())
    //     .then(data => {
    //         console.log('Response from server:', data);
    //         setShowForm(false);
    //         window.location.reload(); // Refresh the page after form submission
    //     })
    //     .catch(error => {
    //         console.error('Error adding new entry:', error);
    //     });
    // };

    const handleSubmit = async (newData) => {
        console.log('New data:', newData);
        const userVisualNovelKeys = ["id","last_played", "last_updated", "status"];
        
        const path_vn = initial_url + "addVisualNovel";
        const path_uservn = initial_url + "updateUserVisualNovel";
        const vnTableData = {};
        const uservnTableData = {};

        // and the last 3 key-value pairs to secondTableData
        let index = 0;
        for (const [key, value] of Object.entries(newData)) {
            if (key == 'id') {
                // If "id" is present, include it in both tables
                vnTableData[key] = value;
                uservnTableData[key] = value;
            }
            else if (key == 'game') {
                // If "id" is present, include it in both tables
                vnTableData[key] = value;
                uservnTableData[key] = value;
            }
            else if (userVisualNovelKeys.includes(key)) {
                uservnTableData[key] = value; 
            } else {
                vnTableData[key] = value; 
            }
        }

        try{
            let response_vn = await fetchRequest(path_vn, "POST", vnTableData);
            if (response_vn["code"] == "200"){
                //console.log(path_uservn, uservnTableData)
                let response_uvn = await fetchRequest(path_uservn, "PUT", uservnTableData);
                //console.log("herhere",response_uvn)
                if (response_uvn["code"] == "201"){
                    console.log(response_uvn)
                    setShowEditForm(false);

                    refresh_data();
                }
            }
        }
        catch (error) {
            console.error('Error updating entry:', error);
        }
    }

    const getColumnValuesByCondition = (data, targetColumnIndex, conditionColumnIndex, conditionValue) => {
        return data
            .filter(row => row[conditionColumnIndex] === conditionValue)
            .map(row => row[targetColumnIndex]);
    };    

    const handleSlowUpdatesClick = async () => {
        console.log("Slow updates clicked");
        setUpdating(true);
        const values = getColumnValuesByCondition(tableData.rows, 1, 16, 'Ongoing');
        const data_updated = {};

        setFilteredData(values);

        for (const value of values) {
            let response_data = await updateVisualNovelDates(value,true);
                if (response_data["code"] == "200"){
                    data_updated[value] = "Success";

                    //Write to database
                    let date = response_data["data"]["last_updated"];
                    let ver = response_data["data"]["version"];
                    let data_formatted = date;
                    let path = initial_url + "updateUserVisualNovel";
                    let data = {
                        "game": value,
                        "last_updated": data_formatted,
                        "last_updated_ver": ver,
                    };
                    const response = await fetch(path, {
                        method: 'PUT',  
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    });
                    const responseData = await response.json();
                    //console.log('Response from server:', responseData);
                }
                else{
                    data_updated[value] = "Failed";
                }
        }

        console.log("Data updated: ",data_updated)
        setUpdating(false);
        if (data_updated.length > 0) {
            refresh_data();
        }
    };
    
    const handleUpdatesClick = async () => {
        console.log("Updating....");
        setUpdating(true);
        const values = getColumnValuesByCondition(tableData.rows, 1, 16, 'Ongoing');
        const data_updated = {};

        setFilteredData(values);

        for (const value of values) {
            let response_data = await updateVisualNovelDates(value);
                if (response_data["code"] == "200"){
                    data_updated[value] = "Success";

                    //Write to database
                    let date = response_data["data"]["last_updated"];
                    let ver = response_data["data"]["version"];
                    let data_formatted = date;
                    let path = initial_url + "updateUserVisualNovel";
                    let data = {
                        "game": value,
                        "last_updated": data_formatted,
                        "last_updated_ver": ver,
                    };
                    const response = await fetch(path, {
                        method: 'PUT',  
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    });
                    const responseData = await response.json();
                    //console.log('Response from server:', responseData);
                }
                else{
                    data_updated[value] = "Failed";
                }
        }

        console.log("Data updated: ",data_updated)
        setUpdating(false);
        if (data_updated.length > 0) {
            refresh_data();
        }
    };

    function generateRandom(min, max, step) {
        const randomNum = min + Math.random() * (max - min);
        return Math.round(randomNum / step) * step;
    };

    const updateVisualNovelDates = async (game_name, bool = false) => {
        game_name = removeSpecialCharacters(game_name);
        let game_name_formatted = "";

        // TODO: Create a dictionary to store outliers
        // FLAG: Temporary fix for broken promises
        if (game_name.toLowerCase() == "broken promises") {
            game_name_formatted = "broken-promises-2";
        }
        else{
            game_name_formatted = game_name.trim().replaceAll(" ", "-");
        }
        const path = initial_vn_url + "getVNDate";
        const data_url = vn_update_url + game_name_formatted + "/";
        let data = {"url": data_url};
        if (bool) {
            data = {"url": data_url, "limiter_low":60, "limiter_high":600};
        }
        
        
        try {
            const response = await fetch(path, {
                method: 'POST',  
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const responseData = await response.json();
            //console.log('Response from server:', responseData);
            return responseData;

        } catch (error) {
            //console.error('Error adding new entry:', error);
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

    // Function to parse the date string in MM/DD/YYYY format
    const parseDate = (dateString) => {
        if (!dateString) {
            return null;
        }
        const [day, month, year] = dateString.split('/').map(Number);
        return new Date(year, month - 1, day);
    };

    // Function to handle edit button click
    const handleEdit = async (row) => {
        const jpgUrl = `${process.env.PUBLIC_URL}/assets/images/visual_novel/${formatUnderscoreName(removeSpecialCharacters(row[1]))}.jpg`;
        const pngUrl = `${process.env.PUBLIC_URL}/assets/images/visual_novel/${formatUnderscoreName(removeSpecialCharacters(row[1]))}.png`;

        const jpgExists = await checkImage(jpgUrl);
        const imgUrl = jpgExists ? jpgUrl : pngUrl;

        setImg(imgUrl);


        const dataForEdit = tableData.columns.reduce((acc, column, index) => {
            acc[column] = row[index];
            return acc;
        }, {});
        setRowDataForEdit(dataForEdit);
        setShowEditForm(true);
    };

    const checkImage = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    };
    

    const handleCloseEditForm = () => {
        setShowEditForm(false);
    };

    // Function to handle form submission for editing
    const handleEditSubmit = async (updatedData) => {
        // Send PUT request with updated data
        console.log('Updated data:', updatedData);
        // Logic for sending PUT request...
        const userVisualNovelKeys = ["id","last_played", "last_updated", "status","last_played_ver","last_updated_ver"];
        
        const path_vn = initial_url + "updateVisualNovel";
        const path_uservn = initial_url + "updateUserVisualNovel";
        const vnTableData = {};
        const uservnTableData = {};

        // and the last 3 key-value pairs to secondTableData
        let index = 0;
        for (const [key, value] of Object.entries(updatedData)) {
            if (key === 'id') {
                // If "id" is present, include it in both tables
                vnTableData[key] = value;
                uservnTableData[key] = value;
            }
            else if (userVisualNovelKeys.includes(key)) {
                uservnTableData[key] = value; 
            } else {
                vnTableData[key] = value; 
            }
        }

        try{
            let response_vn = await fetchRequest(path_vn, "PUT", vnTableData);
            if (response_vn["code"] == "201"){
                console.log(path_uservn, uservnTableData)
                let response_uvn = await fetchRequest(path_uservn, "PUT", uservnTableData);
                //console.log("herhere",response_uvn)
                if (response_uvn["code"] == "201"){
                    console.log(response_uvn)
                    setShowEditForm(false);

                    refresh_data();
                }
            }
        }
        catch (error) {
            console.error('Error updating entry:', error);
        }
        
        //setShowEditForm(false); // Close the edit form after submission
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
            <button className="getUpdatesButton" onClick={handleUpdatesClick} disabled={updating}>
                <span>Get Updates</span>
                {updating && <Spinner />}
            </button>
            <button className="getSlowUpdatesButton" onClick={handleSlowUpdatesClick} disabled={updating}>
                <span>Get Slow Updates</span>
                {updating && <Spinner />}
            </button>
            <div className="games-updated-container">
                Games updated: 
                <span className="games-updated">
                    {gamesToPlay.map((imgUrl, index) => (
                        <span key={index} className="game-image-container">
                            <img src={imgUrl} alt={`Game ${index}`} className="game-image" />
                        </span>
                    ))}
                </span>
            </div>

            <div className="Table">
                <table>
                    <thead>
                        <tr>
                            {tableData.columns.slice(1,-2).map((columnName, columnIndex) => (
                                ((!showColumns && columnIndex > 0 && columnIndex < 9) ? null : (
                                    <th key={columnName} onClick={() => handleSortingChange(columnName)}>
                                        <span className="column-name">
                                            {formatColumnName(columnName)}
                                        </span>
                                    </th>
                                ))
                            ))}
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.rows.map((row, rowIndex) => {
                            
                            const last_played_date = parseDate(row[14]);
                            const last_updated_date = parseDate(row[15]);
                            const color_date = last_updated_date > last_played_date;

                            return (
                                <tr key={rowIndex}>
                                    {row.slice(1).map((cell, cellIndex) => {
                                        if (!showColumns && cellIndex > 0 && cellIndex < 9) {
                                            return null;
                                        }
                                
                                        // Skip rendering cells 16 and 17 as <td>
                                        if (cellIndex === 16 || cellIndex === 17) {
                                            return null;
                                        }

                                        //console.log(row)
                                
                                        return (
                                        <React.Fragment key={cellIndex}>
                                            <td 
                                                // style={{
                                                //     backgroundColor: cellIndex === 14 && color_date ? 'green' : 
                                                //     (
                                                //         (cellIndex===13 | cellIndex===14) && row[16] !== "Ongoing"? "black" :
                                                //             (cellIndex == 15 && row[16] == "Dropped"? "darkred" : 'inherit')
                                                //     )
                                                // }}

                                                // If the current cell is at index 14 and 'color_date' is true, apply 'UpdatedCell' class. Otherwise, no class is applied.
                                                className={`${cellIndex === 14 && color_date ? 'UpdatedCell ' : 
                                                    // If the current cell is at index 13 or 14, and 'row[16]' has the value 'Dropped', 'Completed', or 'Abandoned', apply 'BlackedOut' class.
                                                    ''}${(cellIndex === 13 || cellIndex === 14) && (row[16] == 'Dropped' || row[16] == 'Completed' || row[16] == 'Abandoned') ? 'BlackedOut' : 
                                                        // If the current cell is at index 15 and 'row[16]' is 'Dropped' or 'Abandoned', apply 'StatusDropped' class.
                                                        ''}${cellIndex === 15 && (row[16] === 'Dropped' || row[16] === 'Abandoned') ? 'StatusDropped ' : 
                                                            // If the current cell is at index 13 or 14 and 'row[16]' has the exact value 'Dr13213opped', apply 'BlackedOut' class.
                                                            ''}${(cellIndex === 13 || cellIndex === 14) && row[16] === 'Dr13213opped' ? 'BlackedOut' : 
                                                                ''}
                                                        `}
                                                
                                                >
                                                {/* Render image for specific columns */}
                                                {cellIndex === 0 && (
                                                    <div className="game_title_cell">
                                                        <img
                                                            src={
                                                            process.env.PUBLIC_URL +
                                                            `assets/images/visual_novel/${formatUnderscoreName(removeSpecialCharacters(row[1]))}.jpg`
                                                            }
                                                            className="game_image_jpg"
                                                            onError={({ currentTarget }) => {
                                                            if (currentTarget.src.includes('jpg')) {
                                                                currentTarget.src =
                                                                process.env.PUBLIC_URL +
                                                                'assets/images/visual_novel/' +
                                                                formatUnderscoreName(removeSpecialCharacters(row[1])) +
                                                                '.png';
                                                                currentTarget.className = 'game_image_png';
                                                            } else {
                                                                currentTarget.src = ' ';
                                                                currentTarget.onerror = null; // prevents looping
                                                            }
                                                            }}
                                                            alt=""
                                                        />
                                                        <br />
                                                        <span className="game_title">{cell}</span>
                                                    </div>
                                                )}

                                                {cellIndex >= 10 && cellIndex <= 12 && (
                                                    <div className="favourite-cell">
                                                        <img
                                                            src={
                                                            process.env.PUBLIC_URL +
                                                            `assets/images/visual_novel/${formatUnderscoreName(removeSpecialCharacters(
                                                                row[1] + ' ' + row[cellIndex + 1]
                                                            ))}.png`
                                                            }
                                                            onError={({ currentTarget }) => {
                                                            currentTarget.onerror = null; // prevents looping
                                                            currentTarget.src = ' ';
                                                            }}
                                                            className="favourite-image"
                                                            alt=""
                                                        />
                                                        <br />
                                                        <span className="text">{cell}</span>
                                                    </div>
                                                )}

                                                {/* Last played and last updated cells*/}
                                                {(cellIndex === 13 || cellIndex === 14) && (
                                                    <div className="text"
                                                    >
                                                        {/* Render cells 16 and 17 under cells 13 and 14 */}
                                                        {cellIndex === 13 && (
                                                            <div className="nested-content">
                                                                <div>Version: <br/>{row[17]}</div>
                                                                <br/>
                                                            </div>
                                                        )}
                                                        {cellIndex === 14 && (
                                                            <div className="nested-content">
                                                                <div>Version: <br/>{row[18]}</div>
                                                                <br/>
                                                            </div>
                                                        )}
                                                        {cell}
                                                        {cellIndex == 13 && (
                                                                <RefreshButton 
                                                                    onClick={ async () => {
                                                                        await fetchRequest(
                                                                            initial_url+"updateUserVisualNovel", 
                                                                            "PUT", 
                                                                            {
                                                                                "game": row[1],
                                                                                "last_played":getCurrentDate(),
                                                                                "last_played_ver":row[18]
                                                                            })
                                                                            refresh_data();
                                                                        }
                                                                    }
                                                                    message = "This button updates the last played date to the last updated date.\n \n Are you sure you want to update the last played date?"
                                                                />
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* Render other cells */}
                                                {cellIndex !== 0 && !(cellIndex >= 10 && cellIndex <= 12) && cellIndex !== 13 && cellIndex !== 14 && cellIndex !== 16 && cellIndex != 17 && (
                                                    <div className="text">{cell}</div>
                                                )}

                                            </td>

                                            {/* Render Edit button in the last column */}
                                            {cellIndex === row.length - 4 && (
                                            <td>
                                                <button onClick={() => handleEdit(row)}>Edit</button>
                                            </td>
                                            )}
                                            
                                        </React.Fragment>
                                        );
                                  })}
                                </tr>
                              );
                        })}
                    </tbody>
                </table>
            </div>
            {/* Edit form */}
            {showEditForm && rowDataForEdit && (
                <UpdateForm
                    img = {img}
                    initialValues={rowDataForEdit} // Pass row data to populate the form fields
                    columns={tableData.columns}
                    showForm={setShowEditForm}
                    onSubmit={handleEditSubmit} // Handle form submission for editing
                    onCloseForm={handleCloseEditForm}
                />
            )}
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
