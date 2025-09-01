import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

export default function(sequelize: Sequelize, DataTypes: any) {
  
  var User = sequelize.define('User', {
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: "users",
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [{ name: "id" }],
      },
    ],
    hooks: {
      beforeCreate: async (user: any) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user: any) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  } as any);

  (User as any).prototype.checkPassword = async function(password: string) {
    return bcrypt.compare(password, (this as any).password);
  };

  (User as any).hashPassword = async (password: string) => {
    return bcrypt.hash(password, 12);
  };

  (User as any).getUserById = async (userId: number) => {
    const userData = await User.findOne({
      where: { id: userId },
    });
    return userData;
  };

  return User;
}