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

const token = localStorage.getItem("token");
if (token) {
  setAuthToken(token);
}

// Authentication Endpoints
interface LoginResponse {
  token: string;
}

export const login = async (username: string, password: string) : Promise<LoginResponse> => {
  const response = await api.post('/auth/login', {username, password});

  const token = response.data.token;

  if (token) {
    localStorage.setItem("token", token);
    setAuthToken(token);

  }
  
  return response.data;
}

export const signup = async (username: string, email: string, password: string) : Promise<any> => {
  const response = await api.post('/auth/signup', {username, email, password});
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

// Basic logs
export const getLogs = async () : Promise<Log[]> => {
  const response = await api.get('/logs');
  return response.data;
}

// Filter logs (inbound / outbound / data range)
export const getLogsFiltered = async (
  action?: string,
  startDate?: string,
  endDate?: string
) : Promise<Log[]> => {
  const response = await api.get('/logs', {
    params: {
      action, startDate, endDate
    },
  });
  return response.data;
}

// Order API
interface OrderItemInput {
  itemId: number;
  quantity: number;
}

interface OrderLine {
  id: number;
  itemId: number;
  quantity: number;
  fulfilled: number;
}

interface Order {
  id: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "BACKLOG";
  createdAt: string;
  lines: OrderLine[];
}

// Create order ( auto backlog )
export const createOrder = async (
  items: OrderItemInput[]
) : Promise<{ message: string; order: Order }> => {
  const response = await api.post('/orders', { items });
  return response.data;
}

// // Get all orders
// export const getOrders = async (status?: string): Promise<Order[]> => {
//   const response = await api.get('/orders', {
//     params: { status },
//   });
//   return response.data;
// }

// // Get backlog orders only
// export const getBacklogOrders = async (): Promise<Order[]> => {
//   const response = await api.get('/orders', {
//     params: { status: "BACKLOG" },
//   });
//   return response.data;
// }

export default api;