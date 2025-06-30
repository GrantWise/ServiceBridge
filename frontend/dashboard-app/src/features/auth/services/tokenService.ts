const TOKEN_KEY = 'servicebridge_token';
const REFRESH_TOKEN_KEY = 'servicebridge_refresh_token';
const USER_KEY = 'servicebridge_user';

export class TokenService {
  static getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  static removeToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  static removeRefreshToken(): void {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  static getUser(): any | null {
    const user = sessionStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  static setUser(user: any): void {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static removeUser(): void {
    sessionStorage.removeItem(USER_KEY);
  }

  static clearAll(): void {
    this.removeToken();
    this.removeRefreshToken();
    this.removeUser();
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  static getTokenExpirationTime(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  }

  static shouldRefreshToken(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const fiveMinutes = 5 * 60; // 5 minutes in seconds
      return payload.exp - currentTime < fiveMinutes;
    } catch (error) {
      return true;
    }
  }
}