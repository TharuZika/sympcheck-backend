import { Sequelize, DataTypes } from 'sequelize';
import _users from "./User";
import _symptomHistories from "./SymptomHistory";

export default function initModels(sequelize: Sequelize) {
  
  var users = _users(sequelize, DataTypes);
  var symptomHistories = _symptomHistories(sequelize, DataTypes);
  
  users.hasMany(symptomHistories, { foreignKey: 'userId', as: 'symptomHistories' });
  symptomHistories.belongsTo(users, { foreignKey: 'userId', as: 'user' });
  
  return {
    users,
    symptomHistories
  };
}
