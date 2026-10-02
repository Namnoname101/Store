import { describe, it, expect } from 'vitest';
import {
  generateVietQrUrl,
  parseOrderCodeFromMemo,
  generateOrderCode,
  validateOrderCode,
  SUPPORTED_BANKS,
  VietQrTemplate,
} from '../../src/lib/vietqr';

describe('VietQR Utility Library', () => {
  describe('generateVietQrUrl', () => {
    it('should generate valid VietQR quicklink URL with default compact2 template', () => {
      const url = generateVietQrUrl('MB', '0987654321', 150000, 'ORD123456');
      expect(url).toBe(
        'https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=150000&addInfo=ORD123456'
      );
    });

    it('should support custom templates: compact, qr_only, print', () => {
      const templates: VietQrTemplate[] = ['compact', 'qr_only', 'print', 'compact2'];
      for (const t of templates) {
        const url = generateVietQrUrl('VCB', '1234567890', 50000, 'ORD654321', t);
        expect(url).toBe(
          `https://img.vietqr.io/image/VCB-1234567890-${t}.png?amount=50000&addInfo=ORD654321`
        );
      }
    });

    it('should trim memo and URL-encode special characters in addInfo', () => {
      const url = generateVietQrUrl('TCB', '1903000000', 200000, '  ORD999888 thanh toan  ');
      expect(url).toContain('addInfo=ORD999888%20thanh%20toan');
    });

    it('should reject invalid amounts (non-integer, zero, negative)', () => {
      expect(() => generateVietQrUrl('MB', '123', 0, 'ORD123456')).toThrow(/amount/i);
      expect(() => generateVietQrUrl('MB', '123', -50000, 'ORD123456')).toThrow(/amount/i);
      expect(() => generateVietQrUrl('MB', '123', 50000.5, 'ORD123456')).toThrow(/amount/i);
      expect(() => generateVietQrUrl('MB', '123', NaN, 'ORD123456')).toThrow(/amount/i);
    });

    it('should reject empty or whitespace-only memo', () => {
      expect(() => generateVietQrUrl('MB', '123', 50000, '')).toThrow(/memo/i);
      expect(() => generateVietQrUrl('MB', '123', 50000, '   ')).toThrow(/memo/i);
    });

    it('should reject missing or empty bankId and accountNo', () => {
      expect(() => generateVietQrUrl('', '123', 50000, 'ORD123456')).toThrow(/bank/i);
      expect(() => generateVietQrUrl('MB', '', 50000, 'ORD123456')).toThrow(/account/i);
    });
  });

  describe('parseOrderCodeFromMemo', () => {
    it('should extract standalone uppercase order code', () => {
      expect(parseOrderCodeFromMemo('ORD123456')).toBe('ORD123456');
    });

    it('should extract lowercase order code as standardized uppercase', () => {
      expect(parseOrderCodeFromMemo('ord123456')).toBe('ORD123456');
      expect(parseOrderCodeFromMemo('OrD654321')).toBe('ORD654321');
    });

    it('should extract order code from typical bank transfer memos with noise', () => {
      const memo1 = 'NGUYEN VAN A CHUYEN TIEN ORD123456 MA GD 9992';
      expect(parseOrderCodeFromMemo(memo1)).toBe('ORD123456');

      const memo2 = 'MBVCB.12345.ORD654321.NGUYEN VAN B';
      expect(parseOrderCodeFromMemo(memo2)).toBe('ORD654321');

      const memo3 = 'FT232938210382 ORD987123 TT DON HANG';
      expect(parseOrderCodeFromMemo(memo3)).toBe('ORD987123');

      const memo4 = 'Thanh toan don hang ord112233 tai website';
      expect(parseOrderCodeFromMemo(memo4)).toBe('ORD112233');
    });

    it('should return null when no order code is found', () => {
      expect(parseOrderCodeFromMemo('Chuyen tien mua hang khong co ma')).toBeNull();
      expect(parseOrderCodeFromMemo('')).toBeNull();
    });

    it('should return null when order code has incorrect digit count', () => {
      expect(parseOrderCodeFromMemo('ORD12345')).toBeNull(); // 5 digits
      expect(parseOrderCodeFromMemo('ORD1234567')).toBeNull(); // 7 digits
    });

    it('should return null when ORD is part of another word or preceded by letters', () => {
      expect(parseOrderCodeFromMemo('ABCORD123456')).toBeNull();
      expect(parseOrderCodeFromMemo('COORD123456')).toBeNull();
    });

    it('should safely handle non-string or undefined input', () => {
      expect(parseOrderCodeFromMemo(null as unknown as string)).toBeNull();
      expect(parseOrderCodeFromMemo(undefined as unknown as string)).toBeNull();
    });
  });

  describe('generateOrderCode', () => {
    it('should generate order code in ORD + 6 digits format', () => {
      const code = generateOrderCode();
      expect(code).toMatch(/^ORD\d{6}$/);
    });

    it('should generate unique codes across invocations', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 50; i++) {
        codes.add(generateOrderCode());
      }
      expect(codes.size).toBeGreaterThan(45);
    });

    it('generated code should pass validateOrderCode', () => {
      const code = generateOrderCode();
      expect(validateOrderCode(code)).toBe(true);
    });
  });

  describe('validateOrderCode', () => {
    it('should return true for valid order codes', () => {
      expect(validateOrderCode('ORD123456')).toBe(true);
      expect(validateOrderCode('ORD000001')).toBe(true);
      expect(validateOrderCode('ord654321')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(validateOrderCode('ORD12345')).toBe(false);
      expect(validateOrderCode('ORD1234567')).toBe(false);
      expect(validateOrderCode('ABC123456')).toBe(false);
      expect(validateOrderCode('ORDABCDEF')).toBe(false);
      expect(validateOrderCode('')).toBe(false);
      expect(validateOrderCode('   ')).toBe(false);
      expect(validateOrderCode(null as unknown as string)).toBe(false);
      expect(validateOrderCode(undefined as unknown as string)).toBe(false);
    });
  });

  describe('SUPPORTED_BANKS', () => {
    const requiredCodes = ['MB', 'VCB', 'TCB', 'VPB', 'TPB', 'ACB', 'BIDV', 'VietinBank'];

    it('should include all 8 required banks', () => {
      for (const code of requiredCodes) {
        const bank = SUPPORTED_BANKS.find((b) => b.code.toUpperCase() === code.toUpperCase());
        expect(bank, `Expected bank ${code} to exist in SUPPORTED_BANKS`).toBeDefined();
        expect(bank?.name).toBeTruthy();
        expect(bank?.shortName).toBeTruthy();
      }
    });

    it('should be iterable as an array', () => {
      expect(Array.isArray(SUPPORTED_BANKS)).toBe(true);
      expect(SUPPORTED_BANKS.length).toBeGreaterThanOrEqual(8);
    });

    it('should support key lookup by bank code', () => {
      expect(SUPPORTED_BANKS['MB']).toBeDefined();
      expect(SUPPORTED_BANKS['MB'].code).toBe('MB');
      expect(SUPPORTED_BANKS['VCB']).toBeDefined();
      expect(SUPPORTED_BANKS['VCB'].code).toBe('VCB');
    });
  });
});
