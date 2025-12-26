/**
 * Users API 서비스
 */

import { env } from '../config/env';

const API_URL = env.VITE_API_URL;

/**
 * 사용자 등록 (Firebase 로그인 후 호출)
 */
export async function registerUser(data: {
  firebaseUid: string;
  email: string;
  name: string;
}): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch (error) {
    console.error('사용자 등록 실패:', error);
    return false;
  }
}

/**
 * 사용자 role 조회 (Admin 체크용)
 */
export async function getUserRole(firebaseUid: string): Promise<{ role: string; isAdmin: boolean }> {
  try {
    const response = await fetch(`${API_URL}/api/users/${firebaseUid}/role`);
    if (!response.ok) {
      return { role: 'user', isAdmin: false };
    }
    return response.json();
  } catch (error) {
    console.error('Role 조회 실패:', error);
    return { role: 'user', isAdmin: false };
  }
}
