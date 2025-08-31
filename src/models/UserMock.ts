import bcrypt from 'bcryptjs';

// Mock User model for testing authentication without Sequelize issues
// This will store users in memory temporarily
const users: any[] = [];
let nextId = 1;

const User = {
  async findOne(options: any) {
    const { where } = options;
    return users.find(user => user.email === where.email) || null;
  },

  async findByPk(id: number) {
    return users.find(user => user.id === id) || null;
  },

  async create(userData: any) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = {
      id: nextId++,
      email: userData.email,
      password: hashedPassword,
      name: userData.name || null,
      age: userData.age || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      checkPassword: async function(password: string) {
        return bcrypt.compare(password, this.password);
      }
    };
    users.push(user);
    return user;
  },

  async hashPassword(password: string) {
    return bcrypt.hash(password, 12);
  }
};

export default User;
