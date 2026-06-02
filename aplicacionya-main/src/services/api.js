import axios from 'axios';
import { API_URL } from '../utils/constants'; 

const api = axios.create({
  baseURL: API_URL, // <--- AQUÍ ESTABA EL ERROR
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export default api;