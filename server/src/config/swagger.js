const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GhostPost REST API',
      version: '1.0.0',
      description: 'Production-quality, anonymous, location-based social discussion platform REST API documentation.',
      contact: {
        name: 'GhostPost Team'
      }
    },
    servers: [
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
          description: 'Enter your JWT access token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65e7a1b2c3d4e5f6a7b8c9d0' },
            username: { type: 'string', example: 'shadowfox' },
            email: { type: 'string', example: 'shadow@example.com' },
            displayName: { type: 'string', example: 'Shadow Fox' },
            anonHandle: { type: 'string', example: 'ShadowFox42' },
            avatarSvg: { type: 'string', example: '<svg...</svg>' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            hasHomeLocation: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Post: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65e7a1b2c3d4e5f6a7b8c9d1' },
            content: { type: 'string', example: 'Is Udaipur cold in January?' },
            tag: { type: 'string', example: 'Question' },
            author: {
              type: 'object',
              properties: {
                anonHandle: { type: 'string', example: 'WanderingGhost12' },
                avatarSvg: { type: 'string' }
              }
            },
            upvotes: { type: 'integer', example: 12 },
            downvotes: { type: 'integer', example: 2 },
            score: { type: 'integer', example: 10 },
            hotScore: { type: 'number', example: 1.452 },
            commentCount: { type: 'integer', example: 3 },
            hasLocation: { type: 'boolean', example: true },
            distanceLabel: { type: 'string', example: 'Within 5 km' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65e7a1b2c3d4e5f6a7b8c9d2' },
            postId: { type: 'string', example: '65e7a1b2c3d4e5f6a7b8c9d1' },
            author: {
              type: 'object',
              properties: {
                anonHandle: { type: 'string', example: 'EchoMaster99' },
                avatarSvg: { type: 'string' }
              }
            },
            content: { type: 'string', example: 'Yes, it gets quite chilly at night!' },
            depth: { type: 'integer', example: 0 },
            upvotes: { type: 'integer', example: 5 },
            downvotes: { type: 'integer', example: 0 },
            score: { type: 'integer', example: 5 },
            isDeleted: { type: 'boolean', example: false },
            replies: {
              type: 'array',
              items: { '$ref': '#/components/schemas/Comment' }
            },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Report: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65e7a1b2c3d4e5f6a7b8c9d3' },
            reporter: { type: 'string' },
            targetType: { type: 'string', enum: ['post', 'comment'], example: 'post' },
            targetId: { type: 'string' },
            reason: {
              type: 'string',
              enum: ['Spam', 'Harassment', 'Hate Speech', 'Inappropriate Content', 'Offensive Language', 'Other'],
              example: 'Spam'
            },
            status: { type: 'string', enum: ['pending', 'reviewed', 'dismissed', 'resolved'], example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Resource not found' },
            code: { type: 'string', example: 'NOT_FOUND' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Session creation, login, register, token refresh and logout' },
      { name: 'Posts', description: 'Global, Nearby & Home feeds, post creation, voting, and deletion' },
      { name: 'Comments', description: 'Nested discussion threads, replies, and comment voting' },
      { name: 'Users', description: 'Profile management, bookmarks, follow system, and home location' },
      { name: 'Reports', description: 'Content flagging and reporting' },
      { name: 'Admin', description: 'Moderation dashboard and report resolution (Admin role required)' }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
