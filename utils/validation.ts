// Validation utilities for forms and user input

export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    
    if (!/[A-Za-z]/.test(password)) {
      errors.push('Password must contain at least one letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate user profile data
   */
  static validateProfile(profile: {
    weight?: number;
    height?: number;
    age?: number;
    activityLevel?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (profile.weight !== undefined) {
      if (profile.weight < 20 || profile.weight > 500) {
        errors.push('Weight must be between 20 and 500 kg');
      }
    }
    
    if (profile.height !== undefined) {
      if (profile.height < 100 || profile.height > 250) {
        errors.push('Height must be between 100 and 250 cm');
      }
    }
    
    if (profile.age !== undefined) {
      if (profile.age < 13 || profile.age > 120) {
        errors.push('Age must be between 13 and 120 years');
      }
    }
    
    if (profile.activityLevel !== undefined) {
      const validLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
      if (!validLevels.includes(profile.activityLevel)) {
        errors.push('Invalid activity level');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate food entry data
   */
  static validateFoodEntry(entry: {
    foodName?: string;
    quantity?: number;
    meal?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!entry.foodName || entry.foodName.trim().length === 0) {
      errors.push('Food name is required');
    }
    
    if (entry.foodName && entry.foodName.length > 100) {
      errors.push('Food name must be less than 100 characters');
    }
    
    if (entry.quantity !== undefined) {
      if (entry.quantity <= 0 || entry.quantity > 50) {
        errors.push('Quantity must be between 0.1 and 50');
      }
    }
    
    if (entry.meal !== undefined) {
      const validMeals = ['breakfast', 'lunch', 'dinner', 'snacks'];
      if (!validMeals.includes(entry.meal)) {
        errors.push('Invalid meal type');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Validate numeric input
   */
  static validateNumber(
    value: number,
    min: number,
    max: number,
    fieldName: string
  ): string | null {
    if (isNaN(value)) {
      return `${fieldName} must be a valid number`;
    }
    
    if (value < min || value > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    
    return null;
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  static isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Check if date is not in the future
   */
  static isDateNotFuture(dateString: string): boolean {
    const inputDate = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    return inputDate <= today;
  }
}

export default ValidationUtils;