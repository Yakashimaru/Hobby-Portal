export const formatUnderscoreName = (name: string) => {
    try{
        return name
            .replace(/\s+/g, '_') // Replace all white spaces with underscores
            .toLowerCase(); // Convert all characters to lowercase
    }
    catch(e){
        return name;
    }
};

export const removeSpecialCharacters = (str: string) => {
    return str.replace(/[^a-zA-Z0-9 ]/g, ''); // Removes all characters except letters, numbers, and spaces
}
