// API service layer for making requests to backend endpoints

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
interface PhoneExistsResponse {
  success: boolean;
  exists: boolean;
  phoneNumber: string;
  message: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
      
      // --- DEBUG LOGS START ---
      console.log(`[ApiService Debug] Calling URL: ${url}`);
      console.log(`[ApiService Debug] Request Method: ${options.method || 'GET'}`);
      if (options.body) {
        console.log(`[ApiService Debug] Request Payload: ${options.body}`);
      }
      // --- DEBUG LOGS END ---

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        // --- DEBUG LOGS START ---
        console.error(`[ApiService Debug] API Response Error for ${url}: Status ${response.status}, Data:`, data);
        // --- DEBUG LOGS END ---
        return {
          success: false,
          error: data.error || 'An error occurred',
        };
      }

      // --- DEBUG LOGS START ---
      console.log(`[ApiService Debug] API Response Success for ${url}: Data:`, data);
      // --- DEBUG LOGS END ---
      return {
        success: true,
        data,
      };
    } catch (error) {
      // --- DEBUG LOGS START ---
      console.error(`[ApiService Debug] Fetch Error for ${endpoint}:`, error);
      // --- DEBUG LOGS END ---
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    profile?: any;
  }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Phone Verification
  async sendVerificationCode(phoneNumber: string) {
    return this.request('/sendVerificationCode', { // <-- CORRECTED PATH HERE
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }


  async verifyPhoneCode(phoneNumber: string, code: string) {
    return this.request('/verifyPhoneCode', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code }),
    });
  }

  // Update the checkPhoneExists method
async checkPhoneExists(phoneNumber: string) {
  return this.request<PhoneExistsResponse>('/checkPhoneExists', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
  });
}

  async resendVerificationCode(phoneNumber: string) {
    // This re-uses the send-verification endpoint as per the requirement
    return this.sendVerificationCode(phoneNumber);
  }
  async resetPasswordConfirm(phoneNumber: string, newPassword: string) {
    return this.request('/resetPasswordConfirm', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, newPassword }),
    });
  }
  

    async resetPasswordRequest(phoneNumber: string) {
      return this.request('/resetPasswordRequest', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      });
    }

  

  // Food search
  async searchFoods(query: string, limit = 20) {
    return this.request(`/api/foods/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async getPopularFoods(limit = 10) {
    return this.request(`/api/foods/popular?limit=${limit}`); 
  }

  // Diary entries
  async getDiaryEntries(userId: string, date?: string) {
    const params = new URLSearchParams({ userId });
    if (date) params.append('date', date);
    
    return this.request(`/api/diary/entries?${params.toString()}`);
  }
}

export const apiService = new ApiService();

