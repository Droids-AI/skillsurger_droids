import axios from 'axios';

export async function fetchUserSubscription(userId: string) {
  const apiBase = import.meta.env.VITE_BACKEND_API || 'http://localhost:5002/api/v1';;
  const url = `${apiBase}/dodo/subscription/${userId}`;
  const response = await axios.get(url);
  return response.data;
} 