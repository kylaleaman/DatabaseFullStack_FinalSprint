const request = require('supertest');
const app = require('../app');

describe('GET /', () => {
  test('It should respond with 200 status code', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });
});

describe('GET /signup', () => {
  test('It should respond with 200 status code', async () => {
    const response = await request(app).get('/signup');
    expect(response.statusCode).toBe(200);
  });
});

describe('GET /login', () => {
  test('It should respond with 200 status code', async () => {
    const response = await request(app).get('/login');
    expect(response.statusCode).toBe(200);
  });
});

describe('GET /logout', () => {
  test('It should respond with 302 status code', async () => {
    const response = await request(app).get('/logout');
    expect(response.statusCode).toBe(302);
  });
});

describe('GET /search', () => {
  test('It should respond with 200 status code', async () => {
    const response = await request(app).get('/search');
    expect(response.statusCode).toBe(200);
  });
});

describe('GET /results', () => {
  test('It should respond with 200 status code', async () => {
    const response = await request(app).get('/results');
    expect(response.statusCode).toBe(200);
  });
});

describe('GET /profile', () => {
  test('It should respond with 302 status code if not authenticated', async () => {
    const response = await request(app).get('/profile');
    expect(response.statusCode).toBe(302);
  });

  // Assuming you have an authenticated user
  test('It should respond with 200 status code if authenticated', async () => {
    const response = await request(app)
      .get('/profile')
      .set('Cookie', ['user_id=authenticated_user_id']);
    expect(response.statusCode).toBe(200);
  });
});

describe('POST /signup', () => {
  test('It should respond with 302 status code and redirect to /login', async () => {
    const response = await request(app)
      .post('/signup')
      .send({ firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'password' });
    expect(response.statusCode).toBe(302);
    expect(response.header['location']).toBe('/login');
  });
});

describe('POST /login', () => {
  test('It should respond with 302 status code and redirect to /search on successful login', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: 'john@example.com', password: 'password' });
    expect(response.statusCode).toBe(302);
    expect(response.header['location']).toBe('/search');
  });

  test('It should respond with 302 status code and redirect to /login on failed login', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: 'john@example.com', password: 'wrongpassword' });
    expect(response.statusCode).toBe(302);
    expect(response.header['location']).toBe('/login');
  });
});

describe('POST /logout', () => {
  test('It should respond with 302 status code and redirect to /login', async () => {
    const response = await request(app).post('/logout');
    expect(response.statusCode).toBe(302);
    expect(response.header['location']).toBe('/login');
  });
});

describe('POST /search', () => {
  test('It should respond with 200 status code', async () => {
    const response = await request(app)
      .post('/search')
      .send({ query: 'foundation', database: 'PostgreSQL' });
    expect(response.statusCode).toBe(200);
  });
});

describe('POST /results', () => {
    test('It should redirect to homepage after submitting results', async () => {
      const response = await request(app)
        .post('/results')
        .send({ dummyData: 'example' });
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/');
    });
  });
  
  describe('POST /profile', () => {
    test('It should redirect to homepage after submitting profile', async () => {
      const response = await request(app)
        .post('/profile')
        .send({ dummyData: 'example' });
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/');
    });
  });
  