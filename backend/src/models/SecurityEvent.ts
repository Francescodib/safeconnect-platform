import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

type SecurityEventType = 'failed_login' | 'rate_limit' | 'invalid_token' | 'suspicious_activity';
type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

interface SecurityEventAttributes {
  id: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  userId: string | null;
  ip: string;
  details: string;
  resolved: boolean;
  createdAt?: Date;
}

interface SecurityEventCreationAttributes extends Partial<SecurityEventAttributes> {
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  ip: string;
  details: string;
}

class SecurityEvent
  extends Model<SecurityEventAttributes, SecurityEventCreationAttributes>
  implements SecurityEventAttributes
{
  declare id: string;
  declare type: SecurityEventType;
  declare severity: SecurityEventSeverity;
  declare userId: string | null;
  declare ip: string;
  declare details: string;
  declare resolved: boolean;

  declare readonly createdAt: Date;
}

SecurityEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('failed_login', 'rate_limit', 'invalid_token', 'suspicious_activity'),
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    resolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'security_events',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

// Associations
SecurityEvent.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(SecurityEvent, {
  foreignKey: 'userId',
  as: 'securityEvents',
});

export default SecurityEvent;
