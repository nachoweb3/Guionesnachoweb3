import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Download video from YouTube
export const downloadVideo = async (url) => {
  try {
    const response = await api.post('/api/download/', { url });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get video info without downloading
export const getVideoInfo = async (url) => {
  try {
    const response = await api.get('/api/download/info', { params: { url } });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Process video with editing options
export const processVideo = async (formData) => {
  try {
    const response = await api.post('/api/edit/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Trim video
export const trimVideo = async (formData) => {
  try {
    const response = await api.post('/api/edit/trim', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Add text overlay
export const addTextToVideo = async (formData) => {
  try {
    const response = await api.post('/api/edit/add-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Convert to vertical format
export const convertToVertical = async (formData) => {
  try {
    const response = await api.post('/api/edit/convert-vertical', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Payment APIs
export const createPaymentIntent = async (amount, currency, productType) => {
  try {
    const response = await api.post('/api/payment/create-payment-intent', {
      amount,
      currency,
      product_type: productType,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getProducts = async () => {
  try {
    const response = await api.get('/api/payment/products');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getStripeConfig = async () => {
  try {
    const response = await api.get('/api/payment/config');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export default api;
