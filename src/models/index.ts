import sequelize from '../config/database';
import User from './User';
import SymptomHistory from './SymptomHistory';

export { User, SymptomHistory };


export default sequelize;

export const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Development mode: You can run migrations with: npm run db:migrate');
      console.log('📊 Creating database tables if they don\'t exist...');
      
      await sequelize.sync({ alter: true });
      console.log('✅ Database tables are ready!');
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    console.log('💡 Please check your database configuration in .env file');
    console.log('💡 Make sure MySQL is running and accessible');
    console.log('💡 Continuing without database connection for now...');

  }
};
