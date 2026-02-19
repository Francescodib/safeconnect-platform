import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface DocumentAttributes {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  shared: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DocumentCreationAttributes extends Partial<DocumentAttributes> {
  title: string;
  content: string;
  ownerId: string;
}

class Document
  extends Model<DocumentAttributes, DocumentCreationAttributes>
  implements DocumentAttributes
{
  declare id: string;
  declare title: string;
  declare content: string;
  declare ownerId: string;
  declare shared: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Document.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'owner_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    shared: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'documents',
    timestamps: true,
    underscored: true,
  }
);

// Associations
Document.belongsTo(User, {
  foreignKey: 'owner_id',
  as: 'owner',
});

User.hasMany(Document, {
  foreignKey: 'owner_id',
  as: 'documents',
});

export default Document;
