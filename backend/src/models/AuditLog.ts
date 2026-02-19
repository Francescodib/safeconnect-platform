import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface AuditLogAttributes {
  id: string;
  action: string;
  userId: string | null;
  ip: string;
  userAgent: string | null;
  details: Record<string, unknown>;
  createdAt?: Date;
}

interface AuditLogCreationAttributes extends Partial<AuditLogAttributes> {
  action: string;
  ip: string;
}

class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  declare id: string;
  declare action: string;
  declare userId: string | null;
  declare ip: string;
  declare userAgent: string | null;
  declare details: Record<string, unknown>;

  declare readonly createdAt: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    action: {
      type: DataTypes.STRING,
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
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

// Associations
AuditLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(AuditLog, {
  foreignKey: 'userId',
  as: 'auditLogs',
});

export default AuditLog;
