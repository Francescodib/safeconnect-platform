import User from './User';
import RefreshToken from './RefreshToken';
import Document from './Document';
import AuditLog from './AuditLog';
import SecurityEvent from './SecurityEvent';

// Initialize all models and associations
const models = {
  User,
  RefreshToken,
  Document,
  AuditLog,
  SecurityEvent,
};

export { User, RefreshToken, Document, AuditLog, SecurityEvent };

export default models;
