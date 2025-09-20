// API Configuration for different environments
const API_BASE_URL = import.meta.env.PROD 
    ? 'https://codemaster-1.onrender.com'  // Replace with your actual Render backend URL
    : 'http://localhost:3000';

export default API_BASE_URL;
