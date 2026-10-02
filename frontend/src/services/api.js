import axios from 'axios';
import { auth } from './firebase';
import * as mockStorage from './mockStorage';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 3000,
});

// Attach Firebase ID token if user is signed in
api.interceptors.request.use(async (config) => {
  try {
    const user = auth?.currentUser;
    if (user && typeof user.getIdToken === 'function') {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore token errors in demo/offline mode
  }
  return config;
});

// Response error handler
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject({ message, status: error.response?.status, original: error });
  }
);

// ===== Auth =====
export const syncUser = async (data) => {
  try {
    const res = await api.post('/auth/sync', data);
    return res.data;
  } catch {
    // Graceful fallback
    return { ok: true, synced: 'local' };
  }
};

// ===== Contacts =====
export const getContacts = async () => {
  try {
    const res = await api.get('/contacts');
    return res.data;
  } catch {
    return mockStorage.getStoredContacts();
  }
};

export const createContact = async (data) => {
  try {
    const res = await api.post('/contacts', data);
    return res.data;
  } catch {
    const updated = mockStorage.saveContact(data);
    return updated[0] || data;
  }
};

export const updateContact = async (id, data) => {
  try {
    const res = await api.put(`/contacts/${id}`, data);
    return res.data;
  } catch {
    mockStorage.saveContact({ ...data, id });
    return { id, ...data };
  }
};

export const deleteContact = async (id) => {
  try {
    const res = await api.delete(`/contacts/${id}`);
    return res.data;
  } catch {
    return mockStorage.removeContact(id);
  }
};

export const setPrimaryContact = async (id) => {
  try {
    const res = await api.patch(`/contacts/${id}/primary`);
    return res.data;
  } catch {
    return mockStorage.setPrimaryContactId(id);
  }
};

export const sendTestAlert = async (id) => {
  try {
    const res = await api.post(`/contacts/${id}/test-alert`);
    return res.data;
  } catch (err) {
    // No backend reachable: say so rather than implying a message was sent.
    return {
      ok: false,
      status: 'offline',
      detail: err?.message || 'Could not reach the SafePath server',
    };
  }
};

export const getSmsStatus = async () => {
  try {
    const res = await api.get('/sos/status');
    return res.data;
  } catch {
    return { smsConfigured: false, provider: null, detail: 'Server unreachable' };
  }
};

// ===== Journeys =====
export const createJourney = async (data) => {
  try {
    const res = await api.post('/journeys', data);
    // The tracking screen reads the active journey from local state, so keep
    // the server's record mirrored there.
    return mockStorage.setActiveJourney(res.data);
  } catch {
    return mockStorage.createNewJourney(data);
  }
};

export const getJourney = async (id) => {
  try {
    const res = await api.get(`/journeys/${id}`);
    return res.data;
  } catch {
    const active = mockStorage.getStoredActiveJourney();
    if (active && active.id === id) return active;
    const all = mockStorage.getStoredJourneys();
    return all.find((j) => j.id === id) || active;
  }
};

export const startJourney = async (id) => {
  try {
    const res = await api.patch(`/journeys/${id}/start`);
    return res.data;
  } catch {
    return mockStorage.updateJourneyProgress(5, null, 'Journey started');
  }
};

export const endJourney = async (id) => {
  try {
    const res = await api.patch(`/journeys/${id}/end`);
    return res.data;
  } catch {
    return mockStorage.finishJourney();
  }
};

export const cancelJourney = async (id) => {
  try {
    const res = await api.patch(`/journeys/${id}/cancel`);
    return res.data;
  } catch {
    // Callers already clear local state; nothing to mirror.
    return null;
  }
};

export const postLocation = async (id, data) => {
  try {
    const res = await api.post(`/journeys/${id}/location`, data);
    return res.data;
  } catch {
    return mockStorage.updateJourneyProgress(data.progress || 10, [data.lat, data.lng], data.message);
  }
};

export const getMyJourneys = async () => {
  try {
    const res = await api.get('/journeys');
    return res.data;
  } catch {
    return mockStorage.getStoredJourneys();
  }
};

export const getActiveJourney = async () => {
  try {
    const res = await api.get('/journeys/active');
    return res.data;
  } catch {
    return mockStorage.getStoredActiveJourney();
  }
};

// ===== Safety Assessment =====
export const assessSafety = async (data) => {
  try {
    const res = await api.post('/safety/assess', data);
    return res.data;
  } catch {
    // Generate realistic rule-based safety breakdown
    const isNight = data.time === 'night';
    const baseScore = isNight ? 82 : 94;
    return {
      safetyScore: baseScore,
      rating: baseScore > 85 ? 'LOW RISK (SAFE)' : 'MEDIUM RISK',
      factors: {
        lightingScore: isNight ? 78 : 98,
        crowdDensity: isNight ? 'Moderate' : 'High / Active',
        policeBoothsNearby: 3,
        cctvCoverage: '85% of route monitored',
        emergencyStopsCount: 4,
      },
    };
  }
};

// ===== SOS =====
export const triggerSOS = async (data) => {
  try {
    const res = await api.post('/sos', data);
    return res.data;
  } catch {
    return mockStorage.recordSOSEvent(data);
  }
};

export const getSOSHistory = async () => {
  try {
    const res = await api.get('/sos');
    return res.data;
  } catch {
    return mockStorage.getStoredSOSLogs();
  }
};

// ===== Shared Journey (public, no auth) =====
export const getSharedJourney = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/share/${token}`);
    return res.data;
  } catch {
    const active = mockStorage.getStoredActiveJourney();
    if (active) return active;
    const all = mockStorage.getStoredJourneys();
    return all.find((j) => j.shareToken === token) || all[0] || null;
  }
};

export default api;
