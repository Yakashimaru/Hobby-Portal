import { initial_url } from "../settings/databaseSettings";

async function editDatabase(url_path, data) {
    const figurineUrl = initial_url + url_path;
    try{

    }catch (error){
        console.error('Error editing figurine data:', error);
        throw error;
    }
}

export default editDatabase;