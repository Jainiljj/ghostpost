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

describe('GhostPost Full-Stack API Integration Tests', () => {

  describe('Anonymous Authentication', () => {
    test('should create a new anonymous user session', async () => {
      const res = await request(app).post('/api/auth/session').send();
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user).toHaveProperty('anonHandle');
      const user = await User.findOne({ anonHandle: res.body.data.user.anonHandle });
      expect(user).toBeTruthy();
    });

    test('should restore session with a valid refresh token', async () => {
      const res1 = await request(app).post('/api/auth/session').send();
      const res2 = await request(app).post('/api/auth/session').send({ token: res1.body.data.refreshToken });
      expect(res2.statusCode).toBe(200);
      expect(res2.body.data.user.anonHandle).toBe(res1.body.data.user.anonHandle);
    });
  });

  describe('Proper Credential Authentication', () => {
    test('should register a new user account', async () => {
      const res = await request(app).post('/api/auth/register').send({ username: 'batman', email: 'batman@gotham.com', password: 'secretpassword' });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.username).toBe('batman');
      const user = await User.findOne({ username: 'batman' });
      expect(user.email).toBe('batman@gotham.com');
    });

    test('should log in an existing registered user', async () => {
      await request(app).post('/api/auth/register').send({ username: 'joker', email: 'joker@gotham.com', password: 'whysoserious' });
      const res = await request(app).post('/api/auth/login').send({ emailOrUsername: 'joker', password: 'whysoserious' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.username).toBe('joker');
    });

    test('should fail to log in with incorrect credentials', async () => {
      await request(app).post('/api/auth/register').send({ username: 'riddler', email: 'riddler@gotham.com', password: 'riddlemethis' });
      const res = await request(app).post('/api/auth/login').send({ emailOrUsername: 'riddler', password: 'wrongpassword' });
      expect(res.statusCode).toBe(401);
    });

    test('should prevent duplicate username registrations', async () => {
      await request(app).post('/api/auth/register').send({ username: 'robin', email: 'robin@gotham.com', password: 'holycredentials' });
      const res = await request(app).post('/api/auth/register').send({ username: 'robin', email: 'robin2@gotham.com', password: 'holycredentials' });
      expect(res.statusCode).toBe(400);
    });

    test('[BUG FIX] should login with case-insensitive username', async () => {
      await request(app).post('/api/auth/register').send({ username: 'Nightwing', email: 'nw@gotham.com', password: 'dickg123' });
      const res = await request(app).post('/api/auth/login').send({ emailOrUsername: 'nightwing', password: 'dickg123' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.username).toBe('nightwing'); // stored lowercase
    });
  });

  describe('Post Operations', () => {
    let token;
    beforeEach(async () => {
      const res = await request(app).post('/api/auth/session').send();
      token = res.body.data.accessToken;
    });

    test('should create a post and mask location coordinates', async () => {
      const res = await request(app).post('/api/posts').set('Authorization', 'Bearer ' + token).send({ content: 'Anon post with coords', tag: 'Confession', latitude: 24.5854, longitude: 73.7125 });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.location).toBeUndefined();
      expect(res.body.data.hasLocation).toBe(true);
      const post = await Post.findById(res.body.data._id);
      expect(post.location.coordinates).toEqual([73.7125, 24.5854]);
    });

    test('should fetch global feed sorted by score', async () => {
      await Post.create({ authorAnonId: new mongoose.Types.ObjectId(), authorHandle: 'G1', authorAvatarColor: '#000', authorAvatarEmoji: '??', content: 'Low score', tag: 'Discussion', score: 10 });
      await Post.create({ authorAnonId: new mongoose.Types.ObjectId(), authorHandle: 'G2', authorAvatarColor: '#111', authorAvatarEmoji: '??', content: 'High score', tag: 'Rant', score: 50 });
      const res = await request(app).get('/api/posts/global?sort=top').send();
      expect(res.statusCode).toBe(200);
      expect(res.body.data.posts[0].content).toBe('High score');
    });

    test('[BUG FIX] deleting a post must clean up its votes', async () => {
      const postRes = await request(app).post('/api/posts').set('Authorization', 'Bearer ' + token).send({ content: 'Delete me', tag: 'Discussion' });
      const postId = postRes.body.data._id;
      await request(app).post('/api/posts/' + postId + '/vote').set('Authorization', 'Bearer ' + token).send({ value: 1 });
      expect(await Vote.countDocuments({ postId })).toBe(1);
      await request(app).delete('/api/posts/' + postId).set('Authorization', 'Bearer ' + token);
      expect(await Vote.countDocuments({ postId })).toBe(0);
    });
  });

  describe('Voting System', () => {
    let token;
    let post;
    beforeEach(async () => {
      const sessionRes = await request(app).post('/api/auth/session').send();
      token = sessionRes.body.data.accessToken;
      post = await Post.create({ authorAnonId: new mongoose.Types.ObjectId(), authorHandle: 'U1', authorAvatarColor: '#000', authorAvatarEmoji: '??', content: 'Vote test', tag: 'Question' });
    });

    test('should upvote and toggle off with same value', async () => {
      const r1 = await request(app).post('/api/posts/' + post._id + '/vote').set('Authorization', 'Bearer ' + token).send({ value: 1 });
      expect(r1.body.data.score).toBe(1);
      const r2 = await request(app).post('/api/posts/' + post._id + '/vote').set('Authorization', 'Bearer ' + token).send({ value: 1 });
      expect(r2.body.data.score).toBe(0);
    });

    test('should enforce unique votes per user per post', async () => {
      const t2 = (await request(app).post('/api/auth/session').send()).body.data.accessToken;
      await request(app).post('/api/posts/' + post._id + '/vote').set('Authorization', 'Bearer ' + t2).send({ value: 1 });
      expect(await Vote.countDocuments({ postId: post._id })).toBe(1);
    });
  });

  describe('Comments and Nested replies', () => {
    let token;
    let post;
    beforeEach(async () => {
      const sessionRes = await request(app).post('/api/auth/session').send();
      token = sessionRes.body.data.accessToken;
      post = await Post.create({ authorAnonId: new mongoose.Types.ObjectId(), authorHandle: 'U1', authorAvatarColor: '#000', authorAvatarEmoji: '??', content: 'Comment test', tag: 'Discussion' });
    });

    test('should create and retrieve nested comment tree', async () => {
      const r1 = await request(app).post('/api/posts/' + post._id + '/comments').set('Authorization', 'Bearer ' + token).send({ content: 'Top level' });
      expect(r1.statusCode).toBe(201);
      await request(app).post('/api/posts/' + post._id + '/comments').set('Authorization', 'Bearer ' + token).send({ content: 'Reply', parentCommentId: r1.body.data._id });
      const r3 = await request(app).get('/api/posts/' + post._id + '/comments').send();
      expect(r3.statusCode).toBe(200);
      expect(r3.body.data.length).toBe(1);
      expect(r3.body.data[0].replies.length).toBe(1);
    });

    test('[BUG FIX] comment vote score should be clamped at 1000', async () => {
      const cRes = await request(app).post('/api/posts/' + post._id + '/comments').set('Authorization', 'Bearer ' + token).send({ content: 'Clamp test' });
      const cId = cRes.body.data._id;
      await Comment.findByIdAndUpdate(cId, { score: 999 });
      const v1 = await request(app).post('/api/comments/' + cId + '/vote').set('Authorization', 'Bearer ' + token).send({ value: 1 });
      expect(v1.body.data.score).toBe(1000);
      const v2 = await request(app).post('/api/comments/' + cId + '/vote').set('Authorization', 'Bearer ' + token).send({ value: 1 });
      expect(v2.body.data.score).toBe(1000);
    });
  });

  describe('Geospatial Queries & Home location', () => {
    let token;
    beforeEach(async () => {
      const sessionRes = await request(app).post('/api/auth/session').send();
      token = sessionRes.body.data.accessToken;
      await Post.create({ authorAnonId: new mongoose.Types.ObjectId(), authorHandle: 'U1', authorAvatarColor: '#000', authorAvatarEmoji: '??', content: 'Close post', tag: 'Discussion', location: { type: 'Point', coordinates: [73.7155, 24.5874] } });
      await Post.create({ authorAnonId: new mongoose.Types.ObjectId(), authorHandle: 'U2', authorAvatarColor: '#000', authorAvatarEmoji: '??', content: 'Far post', tag: 'Discussion', location: { type: 'Point', coordinates: [74.0000, 24.7000] } });
    });

    test('should return only nearby posts within radius', async () => {
      const res = await request(app).get('/api/posts/nearby?lat=24.5854&lng=73.7125&radius=5').send();
      expect(res.statusCode).toBe(200);
      expect(res.body.data.posts.length).toBe(1);
      expect(res.body.data.posts[0].content).toBe('Close post');
      expect(res.body.data.posts[0].distanceLabel).toBe('Within 1 km');
    });

    test('should save Home location and load Home feed', async () => {
      const saveRes = await request(app).patch('/api/users/me/home').set('Authorization', 'Bearer ' + token).send({ longitude: 73.7125, latitude: 24.5854 });
      expect(saveRes.statusCode).toBe(200);
      const homeRes = await request(app).get('/api/posts/home?radius=5').set('Authorization', 'Bearer ' + token).send();
      expect(homeRes.statusCode).toBe(200);
      expect(homeRes.body.data.posts.length).toBe(1);
      expect(homeRes.body.data.posts[0].content).toBe('Close post');
    });
  });

  describe('Reports System', () => {
    let token;
    let post;
    beforeEach(async () => {
      token = (await request(app).post('/api/auth/session').send()).body.data.accessToken;
      post = await Post.create({ authorAnonId: new mongoose.Types.ObjectId(), authorHandle: 'BA', authorAvatarColor: '#f00', authorAvatarEmoji: '??', content: 'Spam', tag: 'Other' });
    });

    test('should submit a valid report', async () => {
      const res = await request(app).post('/api/reports').set('Authorization', 'Bearer ' + token).send({ targetType: 'post', targetId: post._id, reason: 'Spam' });
      expect(res.statusCode).toBe(201);
    });

    test('[BUG FIX] should reject invalid report reason', async () => {
      const res = await request(app).post('/api/reports').set('Authorization', 'Bearer ' + token).send({ targetType: 'post', targetId: post._id, reason: 'Dont like it' });
      expect(res.statusCode).toBe(400);
    });

    test('[BUG FIX] should prevent double-reporting same content', async () => {
      await request(app).post('/api/reports').set('Authorization', 'Bearer ' + token).send({ targetType: 'post', targetId: post._id, reason: 'Spam' });
      const res = await request(app).post('/api/reports').set('Authorization', 'Bearer ' + token).send({ targetType: 'post', targetId: post._id, reason: 'Harassment' });
      expect(res.statusCode).toBe(409);
      expect(res.body.code).toBe('DUPLICATE_REPORT');
    });
  });

  describe('User Profile - getMe endpoint', () => {
    test('[BUG FIX] getMe should include username for registered users', async () => {
      const regRes = await request(app).post('/api/auth/register').send({ username: 'alfred', email: 'alfred@gc.com', password: 'masterkey' });
      const res = await request(app).get('/api/users/me').set('Authorization', 'Bearer ' + regRes.body.data.accessToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.username).toBe('alfred');
    });

    test('[BUG FIX] getMe should return null username for anonymous guests', async () => {
      const token = (await request(app).post('/api/auth/session').send()).body.data.accessToken;
      const res = await request(app).get('/api/users/me').set('Authorization', 'Bearer ' + token);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.username).toBeNull();
    });
  });

});
