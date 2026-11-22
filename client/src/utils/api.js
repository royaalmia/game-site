import { io } from 'socket.io-client';

// Real API Base URL: empty string for same-origin proxy, or VITE_API_URL for remote domain
const API_BASE = import.meta.env.VITE_API_URL || '';

export const getAuthToken = () => localStorage.getItem('ludu_token');
export const setAuthToken = (token) => {
  if (token) localStorage.setItem('ludu_token', token);
  else localStorage.removeItem('ludu_token');
};

/**
 * Real Production API Request Handler
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 404 || response.status === 405) {
      throw new Error('ব্যাকএন্ড সার্ভার এখনও লাইভ করা হয়নি। দয়া করে ব্যাকএন্ড URL কনফিগার করুন।');
    }
    throw new Error(data.error || `সার্ভার এরর (${response.status})`);
  }

  return data;
};

// Singleton Real WebSocket Connection
let socketInstance = null;
export const getSocket = (userId = null) => {
  if (!socketInstance) {
    const socketUrl = API_BASE || window.location.origin;

    socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Real Socket Connected:', socketInstance.id);
      const storedUser = JSON.parse(localStorage.getItem('ludu_user') || 'null');
      if (storedUser?.id) {
        socketInstance.emit('auth', { userId: storedUser.id });
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });
  }

  if (userId && socketInstance?.connected) {
    socketInstance.emit('auth', { userId });
  }

  return socketInstance;
};
