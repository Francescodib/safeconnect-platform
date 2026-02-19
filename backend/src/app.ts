import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import config from './config';
import logger from './config/logger';
import sequelize, { testConnection } from './config/database';
import redisClient, { connectRedis } from './config/redis';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalRateLimiter } from './middleware/rateLimiter';
import { verifyCsrfToken, getCsrfToken } from './middleware/csrf';

const app: Application = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// HTTP request logger
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Rate limiting
app.use('/api/', generalRateLimiter);

// CSRF protection for state-changing operations
app.use('/api/', verifyCsrfToken);

// CSRF token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Swagger documentation
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';
import adminRoutes from './routes/adminRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await testConnection();
    await sequelize.sync({ alter: config.app.env === 'development' });
    logger.info('Database synchronized');

    // Seed database in development mode
    if (config.app.env === 'development') {
      try {
        const { seedDatabase, seedDocuments } = await import('./utils/seed');
        await seedDatabase();
        await seedDocuments();
      } catch (seedError) {
        logger.warn('Database seeding failed (non-fatal)', { error: seedError });
      }
    }

    // Connect to Redis
    await connectRedis();

    // Start Express server
    const PORT = config.app.port;
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.app.env} mode`);
      logger.info(`Frontend URL: ${config.app.frontendUrl}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
      if (config.app.env === 'development') {
        logger.info('Default admin: admin@safeconnect.com / Admin123!@#');
        logger.info('Default user: user@safeconnect.com / User123!@#');
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await sequelize.close();
  await redisClient.quit();
  process.exit(0);
});

// Start the server
startServer();

export default app;
