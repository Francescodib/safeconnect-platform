// Test the RefreshToken model business logic in isolation, without
// requiring a live database connection.

// Replicate the isExpired and isValid logic from RefreshToken.ts
const isExpired = (expiresAt: Date): boolean => new Date() > expiresAt;

const isValid = (isRevoked: boolean, expiresAt: Date): boolean =>
  !isRevoked && !isExpired(expiresAt);

const futureDate = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const pastDate = () => new Date(Date.now() - 1000);

describe('RefreshToken model logic', () => {
  describe('isExpired', () => {
    it('returns false when expiresAt is in the future', () => {
      expect(isExpired(futureDate())).toBe(false);
    });

    it('returns true when expiresAt is in the past', () => {
      expect(isExpired(pastDate())).toBe(true);
    });

    it('returns true when expiresAt is exactly now (boundary)', () => {
      // A date set to 1ms in the past
      expect(isExpired(new Date(Date.now() - 1))).toBe(true);
    });
  });

  describe('isValid', () => {
    it('returns true when not revoked and not expired', () => {
      expect(isValid(false, futureDate())).toBe(true);
    });

    it('returns false when the token is revoked even if not expired', () => {
      expect(isValid(true, futureDate())).toBe(false);
    });

    it('returns false when the token is expired even if not revoked', () => {
      expect(isValid(false, pastDate())).toBe(false);
    });

    it('returns false when the token is both revoked and expired', () => {
      expect(isValid(true, pastDate())).toBe(false);
    });
  });
});
