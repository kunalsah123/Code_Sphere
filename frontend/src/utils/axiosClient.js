//any type of request can be make by axios
import axios from "axios"
import API_BASE_URL from "../config/api.js"

const axiosClient = axios.create({
    baseURL : API_BASE_URL,
    withCredentials : true,
    headers:{
        'Content-Type': 'application/json'
    }
});

export default axiosClient;
