// Simple function to handle all fetch requests in the application
// Path -> URL to fetch data from
// Method -> GET, POST, PUT, DELETE
// Data -> Data to send in the request
// Headers -> Headers to send in the request

const fetchRequest = async (
    path, 
    method_input, 
    data_input,
    headers_input = {'Content-Type': 'application/json'}, 
) => 

{
    try {
        const response = await fetch(path, {
            method: method_input,
            headers: headers_input,
            body: JSON.stringify(data_input),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Response from server:', data);
        return data;
    } catch (error) {
        console.error('Error in fetchRequest:', error);
        throw error; // Re-throw the error to propagate it further
    }
}

export default fetchRequest;