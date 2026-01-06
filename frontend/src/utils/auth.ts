// Authentication utility for checking and managing JWT tokens

export interface User {
  id: string;
  edipi: string;
  firstName: string;
  lastName: string;
  commonName: string;
  email?: string;
  organizationalUnit?: string;
}

export const auth = {
  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  // Get stored user
  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Set authentication data
  setAuth(token: string, user: User): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Logout and redirect to login
  logout(): void {
    this.clearAuth();
    window.location.href = '/login.html';
  },

  // Check authentication on app load
  checkAuth(): void {
    if (!this.isAuthenticated()) {
      window.location.href = '/login.html';
    }
  },

  // Get authorization header for API requests
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // Fetch with authentication
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...options.headers,
      ...this.getAuthHeader(),
    };

    const response = await fetch(url, { ...options, headers });

    // If unauthorized, redirect to login
    if (response.status === 401) {
      this.logout();
      throw new Error('Unauthorized');
    }

    return response;
  },
};
