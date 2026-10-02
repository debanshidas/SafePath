// SafePath Local Data Store & Mock API Service
// Enables full offline-first functionality, demo mode, and local persistence.

const STORAGE_KEYS = {
  USER: 'safepath_user',
  CONTACTS: 'safepath_contacts',
  JOURNEYS: 'safepath_journeys',
  ACTIVE_JOURNEY: 'safepath_active_journey',
  SOS_LOGS: 'safepath_sos_logs',
  PROFILE_SETTINGS: 'safepath_profile_settings',
};

// Initial realistic seed data
const DEFAULT_CONTACTS = [
  {
    id: 'c1',
    name: 'Aarti Sharma',
    relationship: 'Mother',
    phone: '+91 98765 43210',
    isPrimary: true,
    notifyOnStart: true,
    avatarColor: 'bg-emerald-500',
  },
  {
    id: 'c2',
    name: 'Rohan Sharma',
    relationship: 'Brother',
    phone: '+91 98123 45678',
    isPrimary: false,
    notifyOnStart: true,
    avatarColor: 'bg-indigo-500',
  },
  {
    id: 'c3',
    name: 'Ananya Sen',
    relationship: 'Friend / Roommate',
    phone: '+91 97654 32109',
    isPrimary: false,
    notifyOnStart: false,
    avatarColor: 'bg-purple-500',
  },
];

const DEFAULT_RECENT_JOURNEYS = [
  {
    id: 'j-past-1',
    origin: 'Tech Hub Cyber City',
    destination: 'Greenwood Heights Apt 4B',
    mode: 'cab',
    status: 'completed',
    startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 2 + 35 * 60000).toISOString(),
    distanceKm: 8.4,
    durationMins: 32,
    safetyScore: 94,
    shareToken: 'share-past-1',
  },
  {
    id: 'j-past-2',
    origin: 'Metro Station Central',
    destination: 'City Library Cafe',
    mode: 'walk',
    status: 'completed',
    startTime: new Date(Date.now() - 86400000 * 4).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 4 + 18 * 60000).toISOString(),
    distanceKm: 1.6,
    durationMins: 18,
    safetyScore: 88,
    shareToken: 'share-past-2',
  },
];

const DEFAULT_PROFILE = {
  name: 'Priya Sharma',
  email: 'priya@example.com',
  phone: '+91 98765 11223',
  bloodGroup: 'O+',
  allergies: 'None reported',
  emergencyNotes: 'Carries inhaler in purse. Speaks English & Hindi.',
  nightSafetyAlerts: true,
  autoShareAfter9PM: true,
  vibrateInRiskZones: true,
  autoCheckInMins: 15,
};

// Safe fallback helpers
function getItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setItem(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

// Initialize seed data if empty
export function initSeedData() {
  if (!localStorage.getItem(STORAGE_KEYS.CONTACTS)) {
    setItem(STORAGE_KEYS.CONTACTS, DEFAULT_CONTACTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.JOURNEYS)) {
    setItem(STORAGE_KEYS.JOURNEYS, DEFAULT_RECENT_JOURNEYS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROFILE_SETTINGS)) {
    setItem(STORAGE_KEYS.PROFILE_SETTINGS, DEFAULT_PROFILE);
  }
}

// Contacts CRUD
export function getStoredContacts() {
  initSeedData();
  return getItem(STORAGE_KEYS.CONTACTS, DEFAULT_CONTACTS);
}

export function saveContact(contactData) {
  const contacts = getStoredContacts();
  let updated;
  if (contactData.id) {
    // Update existing
    updated = contacts.map((c) =>
      c.id === contactData.id ? { ...c, ...contactData } : c
    );
  } else {
    // Add new
    const newContact = {
      ...contactData,
      id: 'c_' + Date.now(),
      avatarColor: contactData.avatarColor || 'bg-primary-500',
    };
    if (contacts.length === 0 || contactData.isPrimary) {
      contacts.forEach((c) => (c.isPrimary = false));
      newContact.isPrimary = true;
    }
    updated = [newContact, ...contacts];
  }
  setItem(STORAGE_KEYS.CONTACTS, updated);
  return updated;
}

export function removeContact(id) {
  const contacts = getStoredContacts();
  const updated = contacts.filter((c) => c.id !== id);
  if (updated.length > 0 && !updated.some((c) => c.isPrimary)) {
    updated[0].isPrimary = true;
  }
  setItem(STORAGE_KEYS.CONTACTS, updated);
  return updated;
}

export function setPrimaryContactId(id) {
  const contacts = getStoredContacts();
  const updated = contacts.map((c) => ({
    ...c,
    isPrimary: c.id === id,
  }));
  setItem(STORAGE_KEYS.CONTACTS, updated);
  return updated;
}

// Journeys
export function getStoredJourneys() {
  initSeedData();
  return getItem(STORAGE_KEYS.JOURNEYS, DEFAULT_RECENT_JOURNEYS);
}

export function getStoredActiveJourney() {
  return getItem(STORAGE_KEYS.ACTIVE_JOURNEY, null);
}

export function createNewJourney(journeyParams) {
  const token = 'safe_' + Math.random().toString(36).substring(2, 10);
  const journey = {
    id: 'j_' + Date.now(),
    shareToken: token,
    origin: journeyParams.origin || 'Current Location',
    destination: journeyParams.destination || 'Destination',
    originCoords: journeyParams.originCoords || [28.6139, 77.209],
    destCoords: journeyParams.destCoords || [28.6289, 77.219],
    mode: journeyParams.mode || 'walk',
    routeTitle: journeyParams.routeTitle || 'Safest Well-Lit Route',
    safetyScore: journeyParams.safetyScore || 92,
    distanceKm: journeyParams.distanceKm || 3.2,
    durationMins: journeyParams.durationMins || 24,
    status: 'active',
    progress: 0,
    startTime: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    currentCoords: journeyParams.originCoords || [28.6139, 77.209],
    checkIns: [
      {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: 'Journey started with live safety tracking',
      },
    ],
  };

  setItem(STORAGE_KEYS.ACTIVE_JOURNEY, journey);
  return journey;
}

// Mirror a server-created journey into local state so the tracking screen
// and dashboard work identically whether or not the API is reachable.
export function setActiveJourney(journey) {
  if (!journey) return null;
  setItem(STORAGE_KEYS.ACTIVE_JOURNEY, journey);
  return journey;
}

export function updateJourneyProgress(progressPct, coords, checkInMsg = null) {
  const current = getStoredActiveJourney();
  if (!current) return null;

  const updated = {
    ...current,
    progress: Math.min(100, Math.max(0, progressPct)),
    currentCoords: coords || current.currentCoords,
    lastUpdated: new Date().toISOString(),
  };

  if (checkInMsg) {
    updated.checkIns = [
      ...(updated.checkIns || []),
      {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: checkInMsg,
      },
    ];
  }

  setItem(STORAGE_KEYS.ACTIVE_JOURNEY, updated);
  return updated;
}

export function finishJourney() {
  const active = getStoredActiveJourney();
  if (!active) return null;

  const completed = {
    ...active,
    status: 'completed',
    progress: 100,
    endTime: new Date().toISOString(),
  };

  const journeys = getStoredJourneys();
  setItem(STORAGE_KEYS.JOURNEYS, [completed, ...journeys]);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_JOURNEY);
  return completed;
}

export function cancelActiveJourney() {
  const active = getStoredActiveJourney();
  if (active) {
    const cancelled = {
      ...active,
      status: 'cancelled',
      endTime: new Date().toISOString(),
    };
    const journeys = getStoredJourneys();
    setItem(STORAGE_KEYS.JOURNEYS, [cancelled, ...journeys]);
  }
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_JOURNEY);
}

// SOS Logs
export function getStoredSOSLogs() {
  return getItem(STORAGE_KEYS.SOS_LOGS, []);
}

export function recordSOSEvent(data) {
  const logs = getStoredSOSLogs();
  const primaryContact = getStoredContacts().find((c) => c.isPrimary) || getStoredContacts()[0];
  const newLog = {
    id: 'sos_' + Date.now(),
    timestamp: new Date().toISOString(),
    location: data.location || 'Current GPS Coordinates',
    coords: data.coords || [28.6139, 77.209],
    alertSentTo: primaryContact ? `${primaryContact.name} (${primaryContact.phone})` : 'Emergency Contacts',
    batteryLevel: '84%',
    status: 'Alert Dispatched',
  };
  const updated = [newLog, ...logs];
  setItem(STORAGE_KEYS.SOS_LOGS, updated);
  return newLog;
}

// Profile settings
export function getStoredProfile() {
  initSeedData();
  return getItem(STORAGE_KEYS.PROFILE_SETTINGS, DEFAULT_PROFILE);
}

export function saveProfileSettings(settings) {
  const current = getStoredProfile();
  const updated = { ...current, ...settings };
  setItem(STORAGE_KEYS.PROFILE_SETTINGS, updated);
  return updated;
}
