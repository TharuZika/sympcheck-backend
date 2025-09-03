const { DataTypes } = require('sequelize');
// @ts-ignore
const sequelize = require('../config/database.js');

const User = sequelize.define('User', {
  id: {
    autoIncrement: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(250),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: "users",
  timestamps: true,
});

const SymptomHistory = sequelize.define('SymptomHistory', {
  id: {
    autoIncrement: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
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
    allowNull: true,
  },
  age: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: "symptom_histories",
  timestamps: true,
});

User.hasMany(SymptomHistory, { foreignKey: 'userId', as: 'symptomHistories' });
SymptomHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });


const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = { User, SymptomHistory, sequelize, initializeDatabase };
