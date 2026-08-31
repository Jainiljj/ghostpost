require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');
const Report = require('../models/Report');
const { calculateHotScore } = require('../services/rankingService');

// Udaipur Center coordinates (lng, lat)
const centerLng = 73.7125;
const centerLat = 24.5854;

const usersData = [
  { username: 'ghostfox42', displayName: 'Ghost Fox', email: 'ghostfox42@dev.local', password: 'Password123', role: 'user' },
  { username: 'silentwolf17', displayName: 'Silent Wolf', email: 'silentwolf17@dev.local', password: 'Password123', role: 'user' },
  { username: 'hiddenowl83', displayName: 'Hidden Owl', email: 'hiddenowl83@dev.local', password: 'Password123', role: 'user' },
  { username: 'shadowtiger29', displayName: 'Shadow Tiger', email: 'shadowtiger29@dev.local', password: 'Password123', role: 'user' },
  { username: 'stealthpanda55', displayName: 'Stealth Panda', email: 'stealthpanda55@dev.local', password: 'Password123', role: 'user' },
  { username: 'driftingotter99', displayName: 'Drifting Otter', email: 'driftingotter99@dev.local', password: 'Password123', role: 'user' },
  { username: 'adminspecter', displayName: 'Admin Specter', email: 'adminspecter@dev.local', password: 'Password123', role: 'admin' },
];

const postsData = [
  { content: "Just spotted the most beautiful sunset over Lake Pichola! Udaipur is truly magical in the evenings.", tag: "Event", offsetLng: 0.003, offsetLat: 0.002, upvotesCount: 25, downvotesCount: 2 },
  { content: "Confession: I accidentally took someone else's identical black umbrella from the coffee shop near Fatehsagar Lake. If you are wet, I am so sorry!", tag: "Confession", offsetLng: -0.004, offsetLat: -0.003, upvotesCount: 15, downvotesCount: 0 },
  { content: "Anyone studying at Mohanlal Sukhadia University (MLSU)? Looking for notes on Advanced Database Systems. Help a student out!", tag: "Help", offsetLng: 0.015, offsetLat: 0.02, upvotesCount: 8, downvotesCount: 1 },
  { content: "Rant: The traffic around City Palace this afternoon was absolutely insane. Tourists, please use public transport or walk!", tag: "Rant", offsetLng: -0.012, offsetLat: 0.018, upvotesCount: 42, downvotesCount: 8 },
  { content: "Does anyone know if Sajjangarh Monsoon Palace is open till late on weekends? Want to plan a night drive.", tag: "Question", offsetLng: -0.05, offsetLat: 0.01, upvotesCount: 12, downvotesCount: 2 },
  { content: "Just spent the weekend camping near Badi Lake. The stars out here are incredible when you escape the city lights.", tag: "Discussion", offsetLng: -0.12, offsetLat: 0.1, upvotesCount: 50, downvotesCount: 3 },
  { content: "Why do we care so much about public identity online? I think the best conversations happen when people can speak without fear of judgment.", tag: "Discussion", upvotesCount: 120, downvotesCount: 15 },
  { content: "Is standard web development dead because of AI? Or is it just evolving? What are your honest thoughts?", tag: "Question", upvotesCount: 84, downvotesCount: 28 },
  { content: "Me trying to find where the bug is in my React rendering loop vs where it actually was (a typo in my dependency array).", tag: "Meme", upvotesCount: 210, downvotesCount: 12 },
  { content: "Breaking: Tech conference coming up next month. Tickets are online now. Covering Web3, AI, and DevOps trends.", tag: "News", upvotesCount: 18, downvotesCount: 4 },
];

const commentsData = [
  {
    postIndex: 0,
    content: "Fatehsagar is better in my opinion! But Pichola has that heritage vibe.",
    replies: [
      { content: "Agreed, Pichola for heritage, FS for chilling with friends." },
      { content: "I love both, depends on the mood." },
    ],
  },
  {
    postIndex: 1,
    content: "Hahaha, at least you admitted it! I lost my umbrella today too, hope it went to a good home.",
    replies: [
      { content: "Wait, was it a black umbrella with a wooden handle?" },
    ],
  },
  {
    postIndex: 7,
    content: "It's just evolving. AI is a tool, but you still need an engineer to know what to build and how to debug it.",
    replies: [
      { content: "True, but the entry-level jobs are definitely shrinking." },
    ],
  },
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ghostpost';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Vote.deleteMany({});
    await Report.deleteMany({});
    console.log('Cleared existing database collections.');

    // 1. Create Users (password hashed via pre-save hook)
    const seededUsers = await User.insertMany(usersData.map((u) => ({
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      password: u.password, // will NOT be hashed with insertMany!
      role: u.role,
    })));

    // insertMany bypasses pre-save hooks, so hash passwords properly
    // Re-create with proper bcrypt hashing using create one by one
    await User.deleteMany({});
    const properUsers = [];
    for (const u of usersData) {
      const created = await User.create({
        username: u.username,
        displayName: u.displayName,
        email: u.email,
        password: u.password,
        role: u.role,
      });
      properUsers.push(created);
    }
    console.log(`Seeded ${properUsers.length} users.`);

    const getUserRandomly = () => properUsers[Math.floor(Math.random() * properUsers.length)];

    // 2. Create Posts
    const seededPosts = [];
    for (let i = 0; i < postsData.length; i++) {
      const pData = postsData[i];
      const author = getUserRandomly();

      let location = undefined;
      if (pData.offsetLng !== undefined && pData.offsetLat !== undefined) {
        location = {
          type: 'Point',
          coordinates: [centerLng + pData.offsetLng, centerLat + pData.offsetLat],
        };
      }

      const score = pData.upvotesCount - pData.downvotesCount;
      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000);
      const hotScore = calculateHotScore(pData.upvotesCount, pData.downvotesCount, createdAt);

      const post = await Post.create({
        author: author._id,
        content: pData.content,
        tag: pData.tag,
        location,
        upvotes: pData.upvotesCount,
        downvotes: pData.downvotesCount,
        score,
        hotScore,
        createdAt,
      });

      // Seed votes
      const votersCount = pData.upvotesCount + pData.downvotesCount;
      const shuffledUsers = [...properUsers].sort(() => 0.5 - Math.random());
      for (let j = 0; j < Math.min(votersCount, shuffledUsers.length); j++) {
        const voter = shuffledUsers[j];
        const val = j < pData.upvotesCount ? 1 : -1;
        await Vote.create({ userId: voter._id, postId: post._id, value: val });
      }

      seededPosts.push(post);
    }
    console.log(`Seeded ${seededPosts.length} posts with votes.`);

    // 3. Create Comments
    let commentsCount = 0;
    for (const cData of commentsData) {
      const post = seededPosts[cData.postIndex];
      const author = getUserRandomly();

      const parentComment = await Comment.create({
        postId: post._id,
        author: author._id,
        content: cData.content,
        score: Math.floor(Math.random() * 10),
      });
      commentsCount++;

      if (cData.replies) {
        for (const rData of cData.replies) {
          const replyAuthor = getUserRandomly();
          await Comment.create({
            postId: post._id,
            author: replyAuthor._id,
            parentCommentId: parentComment._id,
            content: rData.content,
            score: Math.floor(Math.random() * 5),
          });
          commentsCount++;
        }
      }

      post.commentCount = 1 + (cData.replies ? cData.replies.length : 0);
      await post.save();
    }
    console.log(`Seeded ${commentsCount} comments and replies.`);

    // 4. Seed one test report
    const reporter = properUsers[0];
    const reportedPost = seededPosts[1];
    await Report.create({
      reporterId: reporter._id,
      targetType: 'post',
      targetId: reportedPost._id,
      reason: 'Spam',
      description: 'Looks like duplicate umbrella story spam.',
      status: 'pending',
    });
    reportedPost.reportsCount = 1;
    await reportedPost.save();
    console.log('Seeded 1 pending content report.');

    // 5. Add some follow relationships
    // ghostfox42 follows silentwolf17 and hiddenowl83
    const [gf, sw, ho, st] = properUsers;
    await User.findByIdAndUpdate(gf._id, { $addToSet: { following: [sw._id, ho._id] } });
    await User.findByIdAndUpdate(sw._id, { $addToSet: { followers: gf._id } });
    await User.findByIdAndUpdate(ho._id, { $addToSet: { followers: gf._id } });
    console.log('Seeded follow relationships.');

    console.log('\n✅ Database Seeding Completed Successfully!');
    console.log('\n📋 Test Credentials:');
    usersData.forEach(u => {
      console.log(`  ${u.role === 'admin' ? '👑' : '👤'} @${u.username} | email: ${u.email} | password: ${u.password}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error Seeding Database:', error);
    process.exit(1);
  }
};

seedDB();
