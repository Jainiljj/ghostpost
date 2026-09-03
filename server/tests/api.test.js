process.env.NODE_ENV = 'test';
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const Comment = require('../src/models/Comment');
const Vote = require('../src/models/Vote');
const Report = require('../src/models/Report');

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/ghostpost_test';

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(TEST_MONGO_URI);
});

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await Comment.deleteMany({});
  await Vote.deleteMany({});
  await Report.deleteMany({});
});

// Helper to register and return a user with accessToken
const createTestUser = async (username = 'testuser', email = 'test@example.com', password = 'password123', role = 'user') => {
  const user = await User.create({ username: username.toLowerCase(), email: email.toLowerCase(), password, role });
  const loginRes = await request(app).post('/api/auth/login').send({ emailOrUsername: username, password });
  return { user, token: loginRes.body.data.accessToken, refreshToken: loginRes.body.data.refreshToken };
};

describe('GhostPost Full-Stack API Integration Tests', () => {

  describe('Authentication & User Management', () => {
    test('should register a new user account', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'batman', email: 'batman@gotham.com', password: 'secretpassword', displayName: 'Dark Knight' });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('batman');
      expect(res.body.data.user.displayName).toBe('Dark Knight');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      const user = await User.findOne({ username: 'batman' });
      expect(user).toBeTruthy();
      expect(user.email).toBe('batman@gotham.com');
    });

    test('should log in an existing registered user', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'joker', email: 'joker@gotham.com', password: 'whysoserious' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ emailOrUsername: 'joker', password: 'whysoserious' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.username).toBe('joker');
      expect(res.body.data).toHaveProperty('accessToken');
    });

    test('should login with case-insensitive username and email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'Nightwing', email: 'NW@Gotham.com', password: 'dickg123' });
      
      const res1 = await request(app)
        .post('/api/auth/login')
        .send({ emailOrUsername: 'nightwing', password: 'dickg123' });
      expect(res1.statusCode).toBe(200);

      const res2 = await request(app)
        .post('/api/auth/login')
        .send({ emailOrUsername: 'nw@gotham.com', password: 'dickg123' });
      expect(res2.statusCode).toBe(200);
    });

    test('should fail to log in with incorrect credentials', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'riddler', email: 'riddler@gotham.com', password: 'riddlemethis' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ emailOrUsername: 'riddler', password: 'wrongpassword' });
      expect(res.statusCode).toBe(401);
    });

    test('should prevent duplicate username or email registrations', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'robin', email: 'robin@gotham.com', password: 'holycredentials' });
      
      // Duplicate username
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({ username: 'robin', email: 'robin2@gotham.com', password: 'holycredentials' });
      expect(res1.statusCode).toBe(400);

      // Duplicate email
      const res2 = await request(app)
        .post('/api/auth/register')
        .send({ username: 'robin2', email: 'robin@gotham.com', password: 'holycredentials' });
      expect(res2.statusCode).toBe(400);
    });

    test('should refresh access token with valid refresh token', async () => {
      const { refreshToken } = await createTestUser('flash', 'flash@central.com');
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ token: refreshToken });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    test('should fetch current user profile via getMe', async () => {
      const { token, user } = await createTestUser('alfred', 'alfred@wayne.com');
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer ' + token);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.username).toBe('alfred');
      expect(res.body.data.email).toBe('alfred@wayne.com');
    });
  });

  describe('Post Operations', () => {
    let token, user;
    beforeEach(async () => {
      const auth = await createTestUser('postauthor', 'author@test.com');
      token = auth.token;
      user = auth.user;
    });

    test('should create a post and mask precise location coordinates for privacy', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', 'Bearer ' + token)
        .send({ content: 'Post with coordinates', tag: 'Confession', latitude: 24.5854, longitude: 73.7125 });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.location).toBeUndefined(); // Stripped for privacy
      expect(res.body.data.hasLocation).toBe(true);

      const dbPost = await Post.findById(res.body.data._id);
      expect(dbPost.location.coordinates).toEqual([73.7125, 24.5854]);
    });

    test('should fetch global feed sorted by top score', async () => {
      await Post.create({ author: user._id, content: 'Low score', tag: 'Discussion', score: 10 });
      await Post.create({ author: user._id, content: 'High score', tag: 'Rant', score: 50 });

      const res = await request(app).get('/api/posts/global?sort=top').send();
      expect(res.statusCode).toBe(200);
      expect(res.body.data.posts[0].content).toBe('High score');
    });

    test('deleting a post must clean up its votes and comments', async () => {
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', 'Bearer ' + token)
        .send({ content: 'Delete me', tag: 'Discussion' });
      const postId = postRes.body.data._id;

      await request(app)
        .post('/api/posts/' + postId + '/vote')
        .set('Authorization', 'Bearer ' + token)
        .send({ value: 1 });
      expect(await Vote.countDocuments({ postId })).toBe(1);

      await request(app)
        .delete('/api/posts/' + postId)
        .set('Authorization', 'Bearer ' + token);

      expect(await Vote.countDocuments({ postId })).toBe(0);
      expect(await Post.findById(postId)).toBeNull();
    });
  });

  describe('Voting System', () => {
    let token, post;
    beforeEach(async () => {
      const auth = await createTestUser('voter1', 'voter1@test.com');
      token = auth.token;
      post = await Post.create({ author: auth.user._id, content: 'Vote test post', tag: 'Question' });
    });

    test('should upvote and toggle off with same value', async () => {
      const r1 = await request(app)
        .post('/api/posts/' + post._id + '/vote')
        .set('Authorization', 'Bearer ' + token)
        .send({ value: 1 });
      expect(r1.body.data.score).toBe(1);

      const r2 = await request(app)
        .post('/api/posts/' + post._id + '/vote')
        .set('Authorization', 'Bearer ' + token)
        .send({ value: 1 });
      expect(r2.body.data.score).toBe(0);
    });

    test('should enforce unique votes per user per post', async () => {
      const voter2 = await createTestUser('voter2', 'voter2@test.com');
      await request(app)
        .post('/api/posts/' + post._id + '/vote')
        .set('Authorization', 'Bearer ' + voter2.token)
        .send({ value: 1 });
      expect(await Vote.countDocuments({ postId: post._id })).toBe(1);
    });
  });

  describe('Comments and Nested replies', () => {
    let token, post;
    beforeEach(async () => {
      const auth = await createTestUser('commenter', 'commenter@test.com');
      token = auth.token;
      post = await Post.create({ author: auth.user._id, content: 'Comment test post', tag: 'Discussion' });
    });

    test('should create root comment and nested reply tree', async () => {
      const r1 = await request(app)
        .post('/api/posts/' + post._id + '/comments')
        .set('Authorization', 'Bearer ' + token)
        .send({ content: 'Top level root comment' });
      expect(r1.statusCode).toBe(201);

      await request(app)
        .post('/api/posts/' + post._id + '/comments')
        .set('Authorization', 'Bearer ' + token)
        .send({ content: 'Nested reply', parentCommentId: r1.body.data._id });

      const r3 = await request(app).get('/api/posts/' + post._id + '/comments').send();
      expect(r3.statusCode).toBe(200);
      expect(r3.body.data.length).toBe(1);
      expect(r3.body.data[0].replies.length).toBe(1);
      expect(r3.body.data[0].replies[0].content).toBe('Nested reply');
    });

    test('comment vote score should update properly', async () => {
      const cRes = await request(app)
        .post('/api/posts/' + post._id + '/comments')
        .set('Authorization', 'Bearer ' + token)
        .send({ content: 'Vote on comment test' });
      const cId = cRes.body.data._id;

      const v1 = await request(app)
        .post('/api/comments/' + cId + '/vote')
        .set('Authorization', 'Bearer ' + token)
        .send({ value: 1 });
      expect(v1.body.data.score).toBe(1);
    });
  });

  describe('Geospatial Queries & Home location', () => {
    let token, user;
    beforeEach(async () => {
      const auth = await createTestUser('geouser', 'geo@test.com');
      token = auth.token;
      user = auth.user;

      // Close post (Udaipur center ~24.5854, 73.7125)
      await Post.create({
        author: user._id,
        content: 'Close post',
        tag: 'Discussion',
        location: { type: 'Point', coordinates: [73.7155, 24.5874] }
      });
      // Far post
      await Post.create({
        author: user._id,
        content: 'Far post',
        tag: 'Discussion',
        location: { type: 'Point', coordinates: [74.0000, 24.7000] }
      });
    });

    test('should return only nearby posts within radius', async () => {
      const res = await request(app)
        .get('/api/posts/nearby?lat=24.5854&lng=73.7125&radius=5')
        .send();
      expect(res.statusCode).toBe(200);
      expect(res.body.data.posts.length).toBe(1);
      expect(res.body.data.posts[0].content).toBe('Close post');
      expect(res.body.data.posts[0].distanceLabel).toBe('Within 1 km');
    });

    test('should save Home location and load Home feed', async () => {
      const saveRes = await request(app)
        .patch('/api/users/me/home')
        .set('Authorization', 'Bearer ' + token)
        .send({ longitude: 73.7125, latitude: 24.5854 });
      expect(saveRes.statusCode).toBe(200);

      const homeRes = await request(app)
        .get('/api/posts/home?radius=5')
        .set('Authorization', 'Bearer ' + token)
        .send();
      expect(homeRes.statusCode).toBe(200);
      expect(homeRes.body.data.posts.length).toBe(1);
      expect(homeRes.body.data.posts[0].content).toBe('Close post');
    });
  });

  describe('Reports System', () => {
    let token, post;
    beforeEach(async () => {
      const auth = await createTestUser('reporter', 'reporter@test.com');
      token = auth.token;
      post = await Post.create({ author: auth.user._id, content: 'Spam post test', tag: 'Other' });
    });

    test('should submit a valid report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', 'Bearer ' + token)
        .send({ targetType: 'post', targetId: post._id, reason: 'Spam' });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('should reject invalid report reason', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', 'Bearer ' + token)
        .send({ targetType: 'post', targetId: post._id, reason: 'Dont like it' });
      expect(res.statusCode).toBe(400);
    });

    test('should prevent double-reporting same content by the same user', async () => {
      await request(app)
        .post('/api/reports')
        .set('Authorization', 'Bearer ' + token)
        .send({ targetType: 'post', targetId: post._id, reason: 'Spam' });
      
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', 'Bearer ' + token)
        .send({ targetType: 'post', targetId: post._id, reason: 'Harassment' });
      expect(res.statusCode).toBe(409);
      expect(res.body.code).toBe('DUPLICATE_REPORT');
    });
  });

  describe('Swagger OpenAPI Documentation', () => {
    test('should serve Swagger UI at /api-docs/', async () => {
      const res = await request(app).get('/api-docs/');
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('swagger-ui');
    });

    test('should return raw JSON OpenAPI specification at /api-docs.json', async () => {
      const res = await request(app).get('/api-docs.json');
      expect(res.statusCode).toBe(200);
      expect(res.body.openapi).toBe('3.0.0');
      expect(res.body.info.title).toBe('GhostPost REST API');
      expect(res.body.paths).toHaveProperty('/api/posts/global');
      expect(res.body.paths).toHaveProperty('/api/auth/login');
    });
  });

});

