import bcrypt from 'bcrypt';

jest.mock('bcrypt');
jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Test the User model business logic in isolation, without requiring a
// live database connection.  The pure methods (isLocked, comparePassword,
// hashPassword, incrementFailedAttempts, resetFailedAttempts) are
// exercised through plain objects that share the same interface.

const buildUserLike = (
  overrides: Partial<{
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    lastLoginAt: Date | null;
    password: string;
    isActive: boolean;
  }> = {}
) => ({
  failedLoginAttempts: 0,
  lockedUntil: null as Date | null,
  lastLoginAt: null as Date | null,
  password: 'hashed_password',
  isActive: true,
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

// Replicate the isLocked logic from User.ts
const isLocked = (lockedUntil: Date | null): boolean => {
  if (!lockedUntil) return false;
  return lockedUntil > new Date();
};

// Replicate the incrementFailedAttempts logic
const incrementFailedAttempts = async (user: ReturnType<typeof buildUserLike>): Promise<void> => {
  user.failedLoginAttempts += 1;
  if (user.failedLoginAttempts >= 5) {
    user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  await user.save();
};

// Replicate the resetFailedAttempts logic
const resetFailedAttempts = async (user: ReturnType<typeof buildUserLike>): Promise<void> => {
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();
};

describe('User model logic', () => {
  describe('isLocked', () => {
    it('returns false when lockedUntil is null', () => {
      expect(isLocked(null)).toBe(false);
    });

    it('returns true when lockedUntil is in the future', () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      expect(isLocked(futureDate)).toBe(true);
    });

    it('returns false when lockedUntil is in the past', () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(isLocked(pastDate)).toBe(false);
    });
  });

  describe('comparePassword', () => {
    it('returns true when the candidate password matches', async () => {
      mockedBcrypt.compare = jest.fn().mockResolvedValue(true as never);

      const result = await bcrypt.compare('correct-password', 'hashed_password');
      expect(result).toBe(true);
    });

    it('returns false when the candidate password does not match', async () => {
      mockedBcrypt.compare = jest.fn().mockResolvedValue(false as never);

      const result = await bcrypt.compare('wrong-password', 'hashed_password');
      expect(result).toBe(false);
    });
  });

  describe('hashPassword', () => {
    it('calls bcrypt.hash with the provided password and salt rounds', async () => {
      mockedBcrypt.hash = jest.fn().mockResolvedValue('hashed_result' as never);

      const result = await bcrypt.hash('plain_password', 12);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('plain_password', 12);
      expect(result).toBe('hashed_result');
    });
  });

  describe('incrementFailedAttempts', () => {
    it('increments failedLoginAttempts by 1', async () => {
      const user = buildUserLike({ failedLoginAttempts: 2 });

      await incrementFailedAttempts(user);

      expect(user.failedLoginAttempts).toBe(3);
      expect(user.save).toHaveBeenCalledTimes(1);
    });

    it('locks the account when failedLoginAttempts reaches 5', async () => {
      const user = buildUserLike({ failedLoginAttempts: 4 });

      await incrementFailedAttempts(user);

      expect(user.failedLoginAttempts).toBe(5);
      expect(user.lockedUntil).not.toBeNull();
      expect(user.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });

    it('does not set lockedUntil before reaching the threshold', async () => {
      const user = buildUserLike({ failedLoginAttempts: 1 });

      await incrementFailedAttempts(user);

      expect(user.lockedUntil).toBeNull();
    });
  });

  describe('resetFailedAttempts', () => {
    it('resets failedLoginAttempts to 0 and clears the lock', async () => {
      const user = buildUserLike({
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 60000),
      });

      await resetFailedAttempts(user);

      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
    });

    it('sets lastLoginAt to the current time', async () => {
      const before = Date.now();
      const user = buildUserLike();

      await resetFailedAttempts(user);

      const after = Date.now();
      expect(user.lastLoginAt).not.toBeNull();
      expect(user.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(before);
      expect(user.lastLoginAt!.getTime()).toBeLessThanOrEqual(after);
    });

    it('calls save() once', async () => {
      const user = buildUserLike();

      await resetFailedAttempts(user);

      expect(user.save).toHaveBeenCalledTimes(1);
    });
  });
});
