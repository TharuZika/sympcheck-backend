import { Sequelize, DataTypes } from 'sequelize';

export default function(sequelize: Sequelize, DataTypes: any) {
  var SymptomHistory = sequelize.define('SymptomHistory', {
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: "symptom_histories",
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [{ name: "id" }],
      },
      {
        name: "idx_user_id",
        using: "BTREE",
        fields: [{ name: "userId" }],
      },
    ],
  } as any);

  (SymptomHistory as any).getHistoryByUserId = async (userId: number) => {
    const historyData = await SymptomHistory.findAll({
      where: { userId: userId },
      order: [['timestamp', 'DESC']],
    });
    return historyData;
  };

  return SymptomHistory;
}
