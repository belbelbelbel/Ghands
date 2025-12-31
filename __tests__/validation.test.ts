import { describe, it, expect } from '@jest/globals';
import { profileFormSchema } from '../lib/validation';

describe('profileFormSchema', () => {
  describe('name validation', () => {
    it('should accept valid names', () => {
      const validNames = ['John Doe', "Mary O'Connor", 'Jean-Pierre', 'Maria Garcia'];
      validNames.forEach((name) => {
        const result = profileFormSchema.safeParse({
          name,
          email: 'test@example.com',
          phone: '1234567890',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject names shorter than 2 characters', () => {
      const result = profileFormSchema.safeParse({
        name: 'A',
        email: 'test@example.com',
        phone: '1234567890',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject names longer than 50 characters', () => {
      const longName = 'A'.repeat(51);
      const result = profileFormSchema.safeParse({
        name: longName,
        email: 'test@example.com',
        phone: '1234567890',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 50 characters');
      }
    });

    it('should reject names with numbers or special characters', () => {
      const invalidNames = ['John123', 'John@Doe', 'John_Doe', 'John.Doe'];
      invalidNames.forEach((name) => {
        const result = profileFormSchema.safeParse({
          name,
          email: 'test@example.com',
          phone: '1234567890',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('email validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
      ];
      validEmails.forEach((email) => {
        const result = profileFormSchema.safeParse({
          name: 'John Doe',
          email,
          phone: '1234567890',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
      ];
      invalidEmails.forEach((email) => {
        const result = profileFormSchema.safeParse({
          name: 'John Doe',
          email,
          phone: '1234567890',
        });
        expect(result.success).toBe(false);
      });
    });

    it('should convert email to lowercase', () => {
      const result = profileFormSchema.parse({
        name: 'John Doe',
        email: 'TEST@EXAMPLE.COM',
        phone: '1234567890',
      });
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('phone validation', () => {
    it('should accept valid phone numbers', () => {
      const validPhones = [
        '1234567890',
        '+1234567890',
        '(123) 456-7890',
        '123-456-7890',
      ];
      validPhones.forEach((phone) => {
        const result = profileFormSchema.safeParse({
          name: 'John Doe',
          email: 'test@example.com',
          phone,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject phone numbers shorter than 10 digits', () => {
      const result = profileFormSchema.safeParse({
        name: 'John Doe',
        email: 'test@example.com',
        phone: '123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject phone numbers longer than 15 characters', () => {
      const longPhone = '1'.repeat(16);
      const result = profileFormSchema.safeParse({
        name: 'John Doe',
        email: 'test@example.com',
        phone: longPhone,
      });
      expect(result.success).toBe(false);
    });

    it('should reject phone numbers with invalid characters', () => {
      const invalidPhones = ['abc123', '123@456', '123#456'];
      invalidPhones.forEach((phone) => {
        const result = profileFormSchema.safeParse({
          name: 'John Doe',
          email: 'test@example.com',
          phone,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('complete form validation', () => {
    it('should accept a complete valid form', () => {
      const result = profileFormSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
      });
      expect(result.success).toBe(true);
    });

    it('should reject incomplete forms', () => {
      const incompleteForms = [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'John Doe', phone: '1234567890' },
        { email: 'john@example.com', phone: '1234567890' },
      ];
      incompleteForms.forEach((form) => {
        const result = profileFormSchema.safeParse(form);
        expect(result.success).toBe(false);
      });
    });
  });
});

