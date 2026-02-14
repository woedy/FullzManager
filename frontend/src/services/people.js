import api from './api';

export const getPeople = async (params) => {
    const response = await api.get('/people/', { params });
    return response.data;
};

export const getPerson = async (id) => {
    const response = await api.get(`/people/${id}/`);
    return response.data;
};

export const createPerson = async (data) => {
    const response = await api.post('/people/', data);
    return response.data;
};

export const updatePerson = async (id, data) => {
    const response = await api.patch(`/people/${id}/`, data);
    return response.data;
};

export const deletePerson = async (id) => {
    await api.delete(`/people/${id}/`);
};

export const toggleUsedStatus = async (id) => {
    const response = await api.post(`/people/${id}/toggle_used/`);
    return response.data;
};

export const initiatePerson = async (id) => {
    const response = await api.post(`/people/${id}/initiate/`);
    return response.data;
};

export const markPersonUsed = async (id) => {
    const response = await api.post(`/people/${id}/mark_used/`);
    return response.data;
};

export const revertPersonToAvailable = async (id) => {
    const response = await api.post(`/people/${id}/revert_to_available/`);
    return response.data;
};

export const importPeople = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/people/import_data/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
