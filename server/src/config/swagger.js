const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GhostPost REST API',
      version: '1.0.0',
      description: 'Official API Specification for GhostPost — Anonymous Location-Based Social Discussion Platform.',
      contact: {
        name: 'GhostPost Engineering Team'
      }
    },
    servers: [
      {
        url: '/',
        description: 'Current Environment Server (Production / Local)'
      },
      {
        url: 'https://ghostpost-alpha.vercel.app',
        description: 'Vercel Production Server'
      },
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer Access Token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66d7350787b7a3875125f0fd' },
            username: { type: 'string', example: 'ghostfox42' },
            displayName: { type: 'string', example: 'Ghost Fox' },
            email: { type: 'string', example: 'ghostfox42@dev.local' },
            bio: { type: 'string', example: 'Wandering through the digital mist.' },
            avatar: { type: 'string', example: '' },
            headerImage: { type: 'string', example: '' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            followers: { type: 'array', items: { type: 'string' }, example: ['66d7350787b7a3875125f0f9'] },
            following: { type: 'array', items: { type: 'string' }, example: ['66d7350787b7a3875125f101'] },
            bookmarks: { type: 'array', items: { type: 'string' }, example: [] },
            homeLocation: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: { type: 'array', items: { type: 'number' }, example: [73.7125, 24.5854] }
              }
            },
            hasHomeLocation: { type: 'boolean', example: true },
            followerCount: { type: 'integer', example: 12 },
            followingCount: { type: 'integer', example: 5 },
            joinedDate: { type: 'string', format: 'date-time', example: '2026-09-01T19:24:07.000Z' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Post: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66d7350b87b7a3875125f135' },
            author: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '66d7350787b7a3875125f0fd' },
                username: { type: 'string', example: 'ghostfox42' },
                displayName: { type: 'string', example: 'Ghost Fox' },
                avatar: { type: 'string', example: '' }
              }
            },
            content: { type: 'string', example: 'Rant: The traffic around City Palace this afternoon was absolutely insane.' },
            imageUrl: { type: 'string', example: '' },
            tag: {
              type: 'string',
              enum: ['Confession', 'Event', 'Question', 'Rant', 'Discussion', 'News', 'Help', 'Meme', 'Other'],
              example: 'Rant'
            },
            upvotes: { type: 'integer', example: 42 },
            downvotes: { type: 'integer', example: 8 },
            score: { type: 'integer', example: 34 },
            commentCount: { type: 'integer', example: 5 },
            repostCount: { type: 'integer', example: 1 },
            reportsCount: { type: 'integer', example: 0 },
            hotScore: { type: 'number', example: 469.64 },
            repostOf: { type: 'string', nullable: true, example: null },
            quoteContent: { type: 'string', example: '' },
            hasLocation: { type: 'boolean', example: true },
            distanceLabel: { type: 'string', example: 'Global' },
            userVote: { type: 'integer', enum: [1, -1, 0], example: 0 },
            isBookmarked: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66d7350f87b7a3875125f201' },
            postId: { type: 'string', example: '66d7350b87b7a3875125f135' },
            parentCommentId: { type: 'string', nullable: true, example: null },
            author: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '66d7350787b7a3875125f0f9' },
                username: { type: 'string', example: 'hiddenowl83' },
                displayName: { type: 'string', example: 'Hidden Owl' },
                avatar: { type: 'string', example: '' }
              }
            },
            content: { type: 'string', example: 'Totally agree! Took me 45 minutes to get past the gate.' },
            isDeleted: { type: 'boolean', example: false },
            score: { type: 'integer', example: 12 },
            userVote: { type: 'integer', enum: [1, -1, 0], example: 1 },
            replies: {
              type: 'array',
              items: { '$ref': '#/components/schemas/Comment' },
              example: []
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Report: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66d7351087b7a3875125f300' },
            reporterId: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '66d7350787b7a3875125f0f9' },
                username: { type: 'string', example: 'hiddenowl83' },
                email: { type: 'string', example: 'hiddenowl83@dev.local' }
              }
            },
            targetType: { type: 'string', enum: ['post', 'comment'], example: 'post' },
            targetId: { type: 'string', example: '66d7350b87b7a3875125f135' },
            reason: {
              type: 'string',
              enum: ['Spam', 'Harassment', 'Hate/abuse', 'Sexual content', 'Violence', 'Misinformation', 'Illegal content', 'Other'],
              example: 'Spam'
            },
            description: { type: 'string', example: 'Unsolicited commercial promotion link.' },
            status: { type: 'string', enum: ['pending', 'reviewed', 'resolved', 'dismissed'], example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Invalid credentials or resource not found' },
            code: { type: 'string', example: 'AUTHENTICATION_FAILED' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'User registration, login, token refresh, and session logout' },
      { name: 'Posts', description: 'Global, Nearby & Home feeds, post creation, voting, and deletion' },
      { name: 'Comments', description: 'Nested discussion threads, replies, and comment voting' },
      { name: 'Users', description: 'User profiles, home location, bookmarks, and follow relationships' },
      { name: 'Reports', description: 'Content reporting and flagging system' },
      { name: 'Admin', description: 'Moderation queue management and report resolution' }
    ]
  },
  apis: [
    path.join(__dirname, '../routes/*.js').replace(/\\/g, '/'),
    './server/src/routes/*.js',
    './src/routes/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
