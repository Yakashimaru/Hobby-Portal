// Simple function to handle all fetch requests in the application
// Path -> URL to fetch data from
// Method -> GET, POST, PUT, DELETE
// Data -> Data to send in the request
// Headers -> Headers to send in the request



const fetchRequest = async (
    path: string, 
    method_input: string = 'GET', 
    data_input: any = null,
    headers_input = {'Content-Type': 'application/json'}, 
) => 

    {
        try {
            const options: RequestInit = {
                method: method_input,
                headers: headers_input,
            };

            // Only add body for methods that support it
            if (method_input !== 'GET' && method_input !== 'HEAD' && data_input !== null) {
                options.body = JSON.stringify(data_input);
            }

            const response = await fetch(path, options);

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