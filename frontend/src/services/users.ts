/**
 * Users API 서비스
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
