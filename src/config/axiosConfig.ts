// api/axiosConfig.ts
import axios from 'axios';

// Create an Axios instance with default configuration
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080/api', // Set your base API URL here
    timeout: 5000, // Optional timeout
    headers: {
        'Content-Type': 'application/json', // Default headers
    },
});

// You can add interceptors here if needed (for request/response)

// Export the Axios instance
export default axiosInstance;
