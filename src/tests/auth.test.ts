import request from 'supertest';
import { app } from '../index';
const sequelize = require('../config/database');
const { User } = require('../models');

beforeAll(async () => {
  if (!sequelize.authenticate) {
    await sequelize.authenticate();
  }
});

afterAll(async () => {
  if (sequelize.close) {
    await sequelize.close();
  }
});

beforeEach(async () => {
  await User.destroy({ where: {}, force: true });
});

describe('Auth API Endpoints', () => {

  const testUser = {
    name: 'Test User',
    email: `testuser_${Date.now()}@example.com`,
    password: 'Password123',
  };

  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      });
      
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('message', 'User registered successfully');
    expect(response.body.data).toHaveProperty('token');
  });

  it('should fail to register a user with an existing email', async () => {

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'First User',
        email: testUser.email,
        password: 'password123',
      });


    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Another User',
        email: testUser.email, 
        password: 'anotherPassword',
      });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', 'User with this email already exists');
  });

  it('should log in a registered user successfully', async () => {

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      });

    expect(registerResponse.status).toBe(201);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });


      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('message', 'Login successful');
    expect(response.body.data).toHaveProperty('token');
  });

  it('should fail to log in with an incorrect password', async () => {

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      });

      
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword',
      });
      
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', 'Invalid email or password');
  });
});