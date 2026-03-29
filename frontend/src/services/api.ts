import axios from 'axios';

const API_URL = "http://localhost:3000";

const api = axios.create({
    baseURL: API_URL,
    headers: {
    'Content-Type': 'application/json',
  },
})

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// Authentication Endpoints
interface LoginResponse {
  token: string;
}

export const login = async (username: string, password: string) : Promise<LoginResponse> => {
  const response = await api.post('/auth/login', {username, password});
  return response.data;
}

export const signup = async (username: string, password: string) : Promise<any> => {
  const response = await api.post('/auth/signup', {username, password});
  return response.data;
}

// Item Endpoints
interface Item {
  id: number;
  name: string;
  createdAt: string;
}

interface GetItemsResponse {
  items: Item[];
}

export const getItems = async () : Promise<GetItemsResponse> => {
  const response = await api.get('/items');
  return response.data;
}

interface WithdrawItemResponse {
  message: string;
  stock: { itemId: number; locationId: number; quantity: number };
}

export const withdrawItem = async (itemId: number, locationId: number, quantity: number): Promise<WithdrawItemResponse> => {
  const response = await api.post('/items/withdraw', { itemId, locationId, quantity });
  return response.data;
};

// Log Endpoints
interface Log {
  id: number;
  userId: number;
  itemId: number;
  locationId: number;
  quantity: number;
  action: string;
  createdAt: string;
  user: { username: string };
  item: { name: string };
  location: { name: string };
}

export const getLogs = async () : Promise<Log[]> => {
  const response = await api.get('/logs');
  return response.data;
}

export default api;