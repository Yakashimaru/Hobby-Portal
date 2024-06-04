const formatUnderscoreName = (name) => {
    try{
        return name
            .replace(/\s+/g, '_') // Replace all white spaces with underscores
            .toLowerCase(); // Convert all characters to lowercase
    }
    catch(e){
        return name;
    }
};

export default formatUnderscoreName;