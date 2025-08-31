import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface SymptomHistoryAttributes {
  id: number;
  userId: number;
  originalInput: string;
  processedSymptoms: string[];
  predictions: any;
  age?: string;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SymptomHistoryCreationAttributes extends Optional<SymptomHistoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class SymptomHistory extends Model<SymptomHistoryAttributes, SymptomHistoryCreationAttributes> implements SymptomHistoryAttributes {
  public id!: number;
  public userId!: number;
  public originalInput!: string;
  public processedSymptoms!: string[];
  public predictions!: any;
  public age?: string;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SymptomHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    originalInput: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    processedSymptoms: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    predictions: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    age: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'SymptomHistory',
    tableName: 'symptom_histories',
    timestamps: true,
  }
);

User.hasMany(SymptomHistory, { foreignKey: 'userId', as: 'symptomHistories' });
SymptomHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default SymptomHistory;
