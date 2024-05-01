
import { initial_url } from "../settings/databaseSettings";

async function retrieveDatabase(url_path) {
    const figurineUrl = initial_url + url_path;
    console.log(figurineUrl)
    try {
        const response = await fetch(figurineUrl);
        console.log(response);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        
        return data;
    } catch (error) {
        console.error('Error fetching figurine data:', error);
        throw error;
    }
}

export default retrieveDatabase;

