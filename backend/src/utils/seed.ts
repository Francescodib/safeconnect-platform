import { User } from '../models';
import logger from '../config/logger';

/**
 * Seed database with initial admin user
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@safeconnect.com' },
    });

    if (existingAdmin) {
      logger.info('Admin user already exists, skipping seed');
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@safeconnect.com',
      password: 'Admin123!@#', // Will be hashed by User model hook
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    logger.info('Admin user created successfully', {
      id: adminUser.id,
      email: adminUser.email,
    });

    // Create test user
    const testUser = await User.create({
      email: 'user@safeconnect.com',
      password: 'User123!@#',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    logger.info('Test user created successfully', {
      id: testUser.id,
      email: testUser.email,
    });

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding failed', { error });
    throw error;
  }
};

/**
 * Seed sample documents for testing
 */
export const seedDocuments = async (): Promise<void> => {
  try {
    const { Document } = await import('../models');

    // Get admin and test user
    const adminUser = await User.findOne({ where: { email: 'admin@safeconnect.com' } });
    const testUser = await User.findOne({ where: { email: 'user@safeconnect.com' } });

    if (!adminUser || !testUser) {
      logger.warn('Users not found, skipping document seeding');
      return;
    }

    // Create sample documents
    await Document.create({
      title: 'Welcome to SafeConnect Solutions',
      content: '<h1>Welcome!</h1><p>This is a secure document management system.</p>',
      ownerId: adminUser.id,
      shared: true,
    });

    await Document.create({
      title: 'Security Policy',
      content: '<p>All users must follow security best practices...</p>',
      ownerId: adminUser.id,
      shared: true,
    });

    await Document.create({
      title: 'Private Admin Notes',
      content: '<p>Confidential administrative notes...</p>',
      ownerId: adminUser.id,
      shared: false,
    });

    await Document.create({
      title: 'User Test Document',
      content: '<p>This is a test document created by a regular user.</p>',
      ownerId: testUser.id,
      shared: false,
    });

    logger.info('Sample documents created successfully');
  } catch (error) {
    logger.error('Document seeding failed', { error });
    throw error;
  }
};
