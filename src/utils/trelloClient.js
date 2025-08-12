import axios from 'axios'
import { configDotenv } from 'dotenv';

configDotenv();

const { TRELLO_API_KEY, TRELLO_API_TOKEN, TRELLO_API_LIMIT } = process.env;

const trelloClient = axios.create({
  baseURL: 'https://api.trello.com/1',
  params: {
    key: TRELLO_API_KEY,
    token: TRELLO_API_TOKEN
  },
  headers: {
    'Accept': 'application/json',
  },
  timeout: 8000
});

// Control de tasa de peticiones
let lastRequestTime = 0;
const minRequestInterval = 1000 * (60 / TRELLO_API_LIMIT); // 5 peticiones/min

trelloClient.interceptors.request.use(async (config) => {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;

  if (timeSinceLast < minRequestInterval) {
    await new Promise(resolve =>
      setTimeout(resolve, minRequestInterval - timeSinceLast));
  }

  lastRequestTime = Date.now();
  return config;
});

export default trelloClient;