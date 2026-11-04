import api from '../lib/axios';
import { User, Meeting } from '../types';

export const loginUser = async (username: string, password: string): Promise<{ token: string }> => {
  const response = await api.post('/login', { username, password });
  return response.data;
};

export const registerUser = async (userData: Omit<User, 'token'>): Promise<{ message: string }> => {
  // Returns 201 on success, 302/redirect code on exists, 200 on error.
  // Note: Express returns status 302 (httpStatus.FOUND) on User Already Exists
  const response = await api.post('/register', userData);
  return response.data;
};

export const addToHistory = async (token: string, meetingCode: string): Promise<{ message: string }> => {
  const response = await api.post('/add_to_activity', {
    token,
    meeting_code: meetingCode,
  });
  return response.data;
};

export const getUserHistory = async (token: string): Promise<Meeting[]> => {
  const response = await api.get('/get_all_activity', {
    params: { token },
  });
  // If backend returns an error message {message: "Something went wrong..."} instead of an array,
  // we handle it here:
  if (response.data && !Array.isArray(response.data)) {
    throw new Error(response.data.message || 'Failed to fetch history');
  }
  return response.data;
};

export const uploadAttachment = async (file: File): Promise<{
  fileUrl: string;
  fileName: string;
  fileSize: number;
  type: 'image' | 'file';
}> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
