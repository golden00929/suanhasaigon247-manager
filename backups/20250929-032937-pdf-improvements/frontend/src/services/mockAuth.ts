// Mock authentication service for LocalStorage-based development
export interface MockUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'EMPLOYEE';
  isActive: boolean;
  createdAt: string;
}

// Default demo users
const defaultUsers: MockUser[] = [
  {
    id: '1',
    email: 'admin@suanha.com',
    username: 'admin',
    fullName: '관리자',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'employee@suanha.com',
    username: 'employee1',
    fullName: 'Nhân viên 1',
    role: 'EMPLOYEE',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Demo credentials
const defaultCredentials = {
  'admin@suanha.com': 'admin123',
  'employee@suanha.com': 'employee123',
  'admin': 'admin123',
  'employee1': 'emp123'
};

export class MockAuthService {
  private static USERS_KEY = 'mock_users';
  private static TOKEN_KEY = 'token';
  private static USER_KEY = 'user';

  // Initialize default users if not exists
  static initializeUsers() {
    const existingUsers = localStorage.getItem(this.USERS_KEY);
    if (!existingUsers) {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(defaultUsers));
    }
  }

  // Login with email/username and password
  static async login(emailOrUsername: string, password: string): Promise<{user: MockUser, token: string}> {
    this.initializeUsers();

    // Check credentials
    const validPassword = defaultCredentials[emailOrUsername as keyof typeof defaultCredentials];
    if (!validPassword || validPassword !== password) {
      throw new Error('Invalid credentials');
    }

    // Find user
    const users: MockUser[] = JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
    const user = users.find(u =>
      u.email === emailOrUsername ||
      u.username === emailOrUsername
    );

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate mock token
    const token = `mock_token_${user.id}_${Date.now()}`;

    // Store auth data
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    return { user, token };
  }

  // Get current user from storage
  static getCurrentUser(): MockUser | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);

    if (!token || !userStr) {
      return null;
    }

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  // Logout
  static logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Validate token (mock validation)
  static validateToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const user = this.getCurrentUser();
    return !!(token && user);
  }
}