/**
 * NeuraMindss — Session & Cookie Data Persistence Utility
 * Manages user session state, cookies, theme preferences, and recent UI generations.
 */

// Helper to set a cookie
export const setCookie = (name, value, days = 7) => {
  try {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}${expires}; path=/; SameSite=Lax`;
  } catch (err) {
    console.warn('[SessionStore] Cookie write error:', err.message);
  }
};

// Helper to get a cookie
export const getCookie = (name) => {
  try {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
      }
    }
  } catch (err) {
    console.warn('[SessionStore] Cookie read error:', err.message);
  }
  return null;
};

// Helper to clear a cookie
export const eraseCookie = (name) => {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};

// Save recently generated UIs to session & local storage
export const saveRecentGeneration = (generationData) => {
  if (!generationData) return;
  try {
    const existing = JSON.parse(localStorage.getItem('nm_recent_generations') || '[]');
    const filtered = existing.filter(g => g.timestamp !== generationData.timestamp);
    const updated = [generationData, ...filtered].slice(0, 10); // Keep last 10
    localStorage.setItem('nm_recent_generations', JSON.stringify(updated));
    setCookie('nm_last_prompt', generationData.prompt || '', 3);
  } catch (err) {
    console.warn('[SessionStore] Error saving generation history:', err.message);
  }
};

// Load recent generation history
export const getRecentGenerations = () => {
  try {
    return JSON.parse(localStorage.getItem('nm_recent_generations') || '[]');
  } catch {
    return [];
  }
};

// Save user theme & layout session preference
export const saveSessionPreference = (key, value) => {
  try {
    sessionStorage.setItem(`nm_${key}`, JSON.stringify(value));
    setCookie(`nm_pref_${key}`, value, 30);
  } catch (err) {
    console.warn('[SessionStore] Error saving session preference:', err.message);
  }
};

// Load user session preference
export const getSessionPreference = (key, fallback = null) => {
  try {
    const val = sessionStorage.getItem(`nm_${key}`);
    if (val !== null) return JSON.parse(val);
    const cookieVal = getCookie(`nm_pref_${key}`);
    if (cookieVal !== null) return cookieVal;
  } catch {
    return fallback;
  }
  return fallback;
};
