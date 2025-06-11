export const getProfileSchema = {
  tags: ['profile'],
  summary: 'Get user profile with stats and achievements',
  description: 'Requires authentication via token cookie.',
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      description: 'User profile data',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  username: { type: 'string' },
                  email: { type: 'string' }
                }
              },
              stats: { type: 'object' },
              achievements: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    icon: { type: 'string' },
                    unlocked: { type: 'boolean' },
                    date: { type: 'string', nullable: true },
                    progress: { type: 'number', nullable: true },
                    maxProgress: { type: 'number', nullable: true }
                  }
                }
              }
            }
          }
        }
      }
    },
    401: {
      description: 'Unauthorized - token missing or invalid',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        }
      }
    }
  }
};

export const gameResultSchema = {
  tags: ['game'],
  summary: 'Update user game result (win/loss)',
  description: 'Updates statistics based on a new match result.',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['result'],
    properties: {
      result: { type: 'string', enum: ['win', 'loss'] }
    }
  },
  response: {
    200: {
      description: 'Game result recorded successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              updatedStats: { type: 'object' }
            }
          }
        }
      }
    },
    400: {
      description: 'Invalid request body',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        }
      }
    }
  }
};
