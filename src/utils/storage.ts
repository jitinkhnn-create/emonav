import type { UserData } from '../types';

export function loadUserData(key: string): UserData | null {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as UserData : null;
  } catch {
    return null;
  }
}

export function saveUserData(key: string, data: UserData) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Unable to save user data', error);
  }
}
