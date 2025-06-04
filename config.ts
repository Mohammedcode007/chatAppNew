// src/config.ts
// export const API_URL = 'http://192.168.5.90:3000';


export const BASE_IP = '192.168.56.248';
export const API_PORT = '3000';
export const API_URL = `http://${BASE_IP}:${API_PORT}`;
export const WS_URL = `ws://${BASE_IP}:${API_PORT}`;
