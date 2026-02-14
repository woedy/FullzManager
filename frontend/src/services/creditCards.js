import api from './api';

export const getCreditCards = async (params) => {
    const response = await api.get('/credit-cards/', { params });
    return response.data;
};

export const getCreditCard = async (id) => {
    const response = await api.get(`/credit-cards/${id}/`);
    return response.data;
};

export const createCreditCard = async (data) => {
    const response = await api.post('/credit-cards/', data);
    return response.data;
};

export const updateCreditCard = async (id, data) => {
    const response = await api.patch(`/credit-cards/${id}/`, data);
    return response.data;
};

export const deleteCreditCard = async (id) => {
    await api.delete(`/credit-cards/${id}/`);
};

export const clearAllCreditCards = async () => {
    const response = await api.delete('/credit-cards/clear_all/');
    return response.data;
};