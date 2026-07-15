import api from './axios';

export const getIndentsForIssue = async (yearId, status) => {
    try {
        const response = await api.get('/inter-facility-issue-online', { params: { yearId, status } });
        return response.data;
    } catch (error) { throw error; }
};

export const getIssuesForIndent = async (indentId) => {
    try {
        const response = await api.get(`/inter-facility-issue-online/${indentId}/issues`);
        return response.data;
    } catch (error) { throw error; }
};
