const formatScrappedDate = (dateString) => {
    // Extract the date part from the string
    var datePart = dateString.split(": ")[1];

    // Parse the date string into a Date object
    var dateObject = new Date(datePart);

    // Format the Date object into SQL date format (YYYY-MM-DD)
    var sqlDate = dateObject.toISOString().split('T')[0];

    return sqlDate;
};

export default formatScrappedDate;