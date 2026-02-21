//import axios, create an instance with default config
import axios from "axios";
import { API_URL } from "@/constants";


const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add a request interceptor to include the token in headers
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// route to login when we get 401 or 403 response
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            
            //remove token from localStorage
            localStorage.removeItem("token");

            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);


export default axiosInstance;