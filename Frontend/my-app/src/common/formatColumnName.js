const formatColumnName = (columnName) => {
    return columnName
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
};

export default formatColumnName;