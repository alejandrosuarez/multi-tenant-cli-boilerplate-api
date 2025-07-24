const openApiSchema = {
  openapi: '3.0.0',
  info: {
    title: 'Multi-tenant CLI Boilerplate API',
    description: 'Complete API documentation with interactive playground',
    version: '1.0.0',
    contact: {
      name: 'API Support'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server'
    },
    {
      url: 'https://multi-tenant-cli-boilerplate-api.vercel.app',
      description: 'Production Server'
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'OTP-based authentication endpoints'
    },
    {
      name: 'Entities',
      description: 'Entity management endpoints'
    },
    {
      name: 'Images',
      description: 'Image upload and management'
    },
    {
      name: 'Search',
      description: 'Advanced search and filtering'
    },
    {
      name: 'Notifications',
      description: 'Push notification management'
    },
    {
      name: 'System',
      description: 'System health and utilities'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter the token you received from the verify-otp endpoint'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          }
        }
      },
      OTPRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          tenantId: {
            type: 'string',
            description: 'Tenant identifier',
            default: 'default'
          }
        }
      },
      OTPVerifyRequest: {
        type: 'object',
        required: ['email', 'otp'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          otp: {
            type: 'string',
            description: 'One-time password code'
          },
          tenantId: {
            type: 'string',
            description: 'Tenant identifier',
            default: 'default'
          }
        }
      },
      OTPResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean'
          },
          message: {
            type: 'string'
          },
          expiresAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      TokenResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean'
          },
          message: {
            type: 'string'
          },
          user: {
            type: 'object',
            properties: {
              email: {
                type: 'string'
              },
              tenantId: {
                type: 'string'
              }
            }
          },
          token: {
            type: 'string'
          },
          tokenType: {
            type: 'string'
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      UserInfo: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'string'
              },
              email: {
                type: 'string'
              },
              tenant: {
                type: 'string'
              },
              metadata: {
                type: 'object'
              }
            }
          },
          authenticated: {
            type: 'boolean'
          },
          tokenType: {
            type: 'string'
          }
        }
      },
      LogoutResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean'
          },
          message: {
            type: 'string'
          }
        }
      },
      EntityCreate: {
        type: 'object',
        required: ['name', 'category'],
        properties: {
          name: {
            type: 'string',
            description: 'Entity name'
          },
          category: {
            type: 'string',
            description: 'Entity category/type'
          },
          description: {
            type: 'string',
            description: 'Entity description'
          },
          attributes: {
            type: 'object',
            description: 'Custom entity attributes',
            additionalProperties: true
          },
          public_shareable: {
            type: 'boolean',
            description: 'Whether entity can be shared publicly',
            default: true
          }
        }
      },
      EntityUpdate: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Entity name'
          },
          description: {
            type: 'string',
            description: 'Entity description'
          },
          attributes: {
            type: 'object',
            description: 'Custom entity attributes',
            additionalProperties: true
          },
          public_shareable: {
            type: 'boolean',
            description: 'Whether entity can be shared publicly'
          }
        }
      },
      Entity: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          entity_type: {
            type: 'string'
          },
          tenant_id: {
            type: 'string'
          },
          owner_id: {
            type: 'string'
          },
          attributes: {
            type: 'object',
            additionalProperties: true
          },
          share_token: {
            type: 'string'
          },
          public_shareable: {
            type: 'boolean'
          },
          disabled: {
            type: 'boolean'
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          },
          updated_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      EntityList: {
        type: 'object',
        properties: {
          entities: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Entity'
            }
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer'
              },
              limit: {
                type: 'integer'
              },
              total: {
                type: 'integer'
              },
              has_more: {
                type: 'boolean'
              }
            }
          },
          filters_applied: {
            type: 'object',
            additionalProperties: true
          }
        }
      },
      ImageUploadResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean'
          },
          message: {
            type: 'string'
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid'
                },
                urls: {
                  type: 'object',
                  properties: {
                    thumbnail: {
                      type: 'object',
                      properties: {
                        url: { type: 'string' },
                        path: { type: 'string' },
                        size: { type: 'integer' }
                      }
                    },
                    small: {
                      type: 'object',
                      properties: {
                        url: { type: 'string' },
                        path: { type: 'string' },
                        size: { type: 'integer' }
                      }
                    },
                    medium: {
                      type: 'object',
                      properties: {
                        url: { type: 'string' },
                        path: { type: 'string' },
                        size: { type: 'integer' }
                      }
                    },
                    large: {
                      type: 'object',
                      properties: {
                        url: { type: 'string' },
                        path: { type: 'string' },
                        size: { type: 'integer' }
                      }
                    }
                  }
                },
                metadata: {
                  type: 'object',
                  properties: {
                    originalName: { type: 'string' },
                    label: { type: 'string' },
                    entityId: { type: 'string' },
                    tenantId: { type: 'string' },
                    uploadedBy: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      },
      EntityImages: {
        type: 'object',
        properties: {
          entityId: {
            type: 'string',
            format: 'uuid'
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                originalName: { type: 'string' },
                label: { type: 'string' },
                url: { type: 'string' },
                availableSizes: {
                  type: 'array',
                  items: { type: 'string' }
                },
                urls: {
                  type: 'object',
                  additionalProperties: true
                },
                uploadedBy: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            }
          },
          requestedSize: { type: 'string' },
          totalImages: { type: 'integer' }
        }
      },
      CategoryList: {
        type: 'object',
        properties: {
          categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                display_name: { type: 'string' },
                description: { type: 'string' },
                base_schema: { type: 'object' },
                active: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' }
              }
            }
          },
          total: { type: 'integer' }
        }
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          version: { type: 'string' },
          environment: { type: 'string' },
          services: {
            type: 'object',
            properties: {
              database: { type: 'string' },
              auth: { type: 'string' },
              notifications: { type: 'string' },
              images: { type: 'string' }
            }
          }
        }
      },
      DeviceSubscription: {
        type: 'object',
        required: ['deviceToken'],
        properties: {
          deviceToken: {
            type: 'string',
            description: 'OneSignal player ID'
          },
          tenantContext: {
            type: 'string',
            description: 'Tenant identifier',
            default: 'default'
          }
        }
      },
      NotificationSend: {
        type: 'object',
        required: ['userId', 'eventType', 'message'],
        properties: {
          userId: {
            type: 'string',
            description: 'User ID to send notification to'
          },
          eventType: {
            type: 'string',
            description: 'Type of notification event'
          },
          message: {
            type: 'string',
            description: 'Notification message'
          },
          link: {
            type: 'string',
            description: 'Optional URL to include in notification'
          },
          tenantContext: {
            type: 'string',
            description: 'Tenant identifier',
            default: 'default'
          },
          eventPayload: {
            type: 'object',
            description: 'Additional data for the notification',
            additionalProperties: true
          }
        }
      },
      ChatRequest: {
        type: 'object',
        required: ['entityId', 'chatUrl'],
        properties: {
          entityId: {
            type: 'string',
            description: 'Entity ID to send chat request about'
          },
          chatUrl: {
            type: 'string',
            description: 'URL for the chat interface'
          }
        }
      },
      NotificationPreferences: {
        type: 'object',
        required: ['preferences'],
        properties: {
          preferences: {
            type: 'object',
            properties: {
              chat_requests: { type: 'boolean' },
              attribute_updates: { type: 'boolean' },
              reminders: { type: 'boolean' },
              marketing: { type: 'boolean' }
            }
          }
        }
      },
      InteractionLog: {
        type: 'object',
        required: ['eventType'],
        properties: {
          eventType: {
            type: 'string',
            description: 'Type of event to log'
          },
          entityId: {
            type: 'string',
            description: 'Related entity ID'
          },
          eventPayload: {
            type: 'object',
            description: 'Additional event data',
            additionalProperties: true
          }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'System health check',
        description: 'Get system status and service health',
        responses: {
          '200': {
            description: 'System health information',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/send-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Send OTP',
        description: 'Send a one-time password to user\'s email for authentication',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OTPRequest'
              },
              examples: {
                default: {
                  value: {
                    email: 'test@example.com',
                    tenantId: 'default'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'OTP sent successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/OTPResponse'
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/verify-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify OTP & Login',
        description: 'Verify OTP code and receive a persistent authentication token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OTPVerifyRequest'
              },
              examples: {
                default: {
                  value: {
                    email: 'test@example.com',
                    otp: '123456',
                    tenantId: 'default'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'OTP verified successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TokenResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid OTP',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get Current User',
        description: 'Get information about the currently authenticated user',
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'User information',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UserInfo'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout',
        description: 'Invalidate the current authentication token',
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'Logged out successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LogoutResponse'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/entities': {
      get: {
        tags: ['Entities'],
        summary: 'List Entities',
        description: 'Get a paginated list of entities with optional filtering',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              default: 1
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: {
              type: 'integer',
              default: 20
            }
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filter by entity category',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'tenant',
            in: 'query',
            description: 'Filter by tenant ID',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'owner_id',
            in: 'query',
            description: 'Filter by entity owner ID (email address)',
            schema: {
              type: 'string'
            },
            example: 'user@example.com'
          },
          {
            name: 'exclude_id',
            in: 'query',
            description: 'Exclude a specific entity by ID',
            schema: {
              type: 'string'
            },
            example: '123e4567-e89b-12d3-a456-426614174000'
          }
        ],
        responses: {
          '200': {
            description: 'List of entities',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/EntityList'
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Entities'],
        summary: 'Create Entity',
        description: 'Create a new entity (requires authentication)',
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/EntityCreate'
              },
              examples: {
                property: {
                  value: {
                    name: 'My Property',
                    category: 'property',
                    description: 'A beautiful house',
                    attributes: {
                      address: '456 Oak St',
                      price: '450000',
                      bedrooms: '4',
                      bathrooms: '3'
                    },
                    public_shareable: true
                  }
                },
                vehicle: {
                  value: {
                    name: 'My Car',
                    category: 'vehicle',
                    description: 'A reliable car',
                    attributes: {
                      make: 'Toyota',
                      model: 'Camry',
                      year: '2020',
                      color: 'Blue'
                    },
                    public_shareable: true
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Entity created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Entity'
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/entities/{id}': {
      get: {
        tags: ['Entities'],
        summary: 'Get Entity by ID',
        description: 'Retrieve a specific entity by its ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Entity ID',
            schema: {
              type: 'string'
            }
          }
        ],
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'Entity details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Entity'
                }
              }
            }
          },
          '404': {
            description: 'Entity not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      },
      patch: {
        tags: ['Entities'],
        summary: 'Update Entity',
        description: 'Update an existing entity (requires authentication and ownership)',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Entity ID',
            schema: {
              type: 'string'
            }
          }
        ],
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/EntityUpdate'
              },
              examples: {
                default: {
                  value: {
                    attributes: {
                      price: '475000',
                      description: 'Updated description'
                    },
                    public_shareable: false
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Entity updated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Entity'
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '404': {
            description: 'Entity not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Entities'],
        summary: 'Delete Entity',
        description: 'Soft delete an entity (requires authentication and ownership)',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Entity ID',
            schema: {
              type: 'string'
            }
          }
        ],
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'Entity deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '404': {
            description: 'Entity not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/entities/{id}/images': {
      post: {
        tags: ['Images'],
        summary: 'Upload Images to Entity',
        description: 'Upload and automatically optimize images for an entity. Only entity owners can upload images.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Entity ID',
            schema: {
              type: 'string'
            }
          }
        ],
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  files: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'binary'
                    },
                    description: 'Image files (jpg, png, webp, max 5MB)'
                  },
                  label: {
                    type: 'string',
                    description: 'Optional label for the image'
                  },
                  is_fallback: {
                    type: 'boolean',
                    description: 'Whether this is a fallback image'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Images uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ImageUploadResponse'
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '403': {
            description: 'Forbidden - not entity owner',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '404': {
            description: 'Entity not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Images'],
        summary: 'Get Entity Images',
        description: 'Retrieve all images for a specific entity',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Entity ID',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'size',
            in: 'query',
            description: 'Image size to return',
            schema: {
              type: 'string',
              enum: ['thumbnail', 'small', 'medium', 'large'],
              default: 'medium'
            }
          }
        ],
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'Entity images',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/EntityImages'
                }
              }
            }
          },
          '404': {
            description: 'Entity not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/images/{id}': {
      delete: {
        tags: ['Images'],
        summary: 'Delete Image',
        description: 'Remove an image and all its optimized versions. Only the user who uploaded the image can delete it.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Image ID',
            schema: {
              type: 'string'
            }
          }
        ],
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'Image deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '403': {
            description: 'Forbidden - not image owner',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '404': {
            description: 'Image not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/entities/search': {
      get: {
        tags: ['Search'],
        summary: 'Advanced Entity Search',
        description: 'Search entities with enhanced filtering, sorting, and optional image inclusion',
        parameters: [
          {
            name: 'q',
            in: 'query',
            description: 'Search query text',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filter by entity category/type',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              default: 1
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: {
              type: 'integer',
              default: 20
            }
          },
          {
            name: 'sort_by',
            in: 'query',
            description: 'Sort field',
            schema: {
              type: 'string',
              default: 'created_at'
            }
          },
          {
            name: 'sort_order',
            in: 'query',
            description: 'Sort order',
            schema: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc'
            }
          },
          {
            name: 'include_images',
            in: 'query',
            description: 'Include image thumbnails',
            schema: {
              type: 'boolean',
              default: false
            }
          },
          {
            name: 'owner_id',
            in: 'query',
            description: 'Filter by entity owner ID (email address)',
            schema: {
              type: 'string'
            },
            example: 'user@example.com'
          },
          {
            name: 'exclude_id',
            in: 'query',
            description: 'Exclude a specific entity by ID',
            schema: {
              type: 'string'
            },
            example: '123e4567-e89b-12d3-a456-426614174000'
          }
        ],
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/EntityList'
                }
              }
            }
          }
        }
      }
    },
    '/api/categories': {
      get: {
        tags: ['Entities'],
        summary: 'Get Available Categories',
        description: 'List all available entity categories',
        responses: {
          '200': {
            description: 'List of categories',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CategoryList'
                }
              }
            }
          }
        }
      }
    },
    '/api/categories/{category}/entities': {
      get: {
        tags: ['Entities'],
        summary: 'Get Entities by Category',
        description: 'Get all entities in a specific category with optional images',
        parameters: [
          {
            name: 'category',
            in: 'path',
            required: true,
            description: 'Category name',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'include_images',
            in: 'query',
            description: 'Include image thumbnails',
            schema: {
              type: 'boolean',
              default: false
            }
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              default: 1
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: {
              type: 'integer',
              default: 20
            }
          }
        ],
        responses: {
          '200': {
            description: 'List of entities in category',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/EntityList'
                }
              }
            }
          }
        }
      }
    },
    '/api/my/entities': {
      get: {
        tags: ['Entities'],
        summary: 'Get My Entities',
        description: 'Get entities owned by the authenticated user',
        security: [
          {
            bearerAuth: []
          }
        ],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              default: 1
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: {
              type: 'integer',
              default: 20
            }
          }
        ],
        responses: {
          '200': {
            description: 'List of user\'s entities',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/EntityList'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/shared/{shareToken}': {
      get: {
        tags: ['Entities'],
        summary: 'Get Shared Entity',
        description: 'Access a publicly shared entity using its share token',
        parameters: [
          {
            name: 'shareToken',
            in: 'path',
            required: true,
            description: 'Entity share token',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Shared entity details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Entity'
                }
              }
            }
          },
          '404': {
            description: 'Entity not found or not shareable',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/notifications/subscribe-device': {
      post: {
        tags: ['Notifications'],
        summary: 'Subscribe Device',
        description: 'Subscribe a device for push notifications (supports both anonymous and authenticated users)',
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DeviceSubscription'
              },
              examples: {
                default: {
                  value: {
                    deviceToken: 'onesignal_player_id_123',
                    tenantContext: 'default'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Device subscribed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        device_token: { type: 'string' },
                        user_id: { type: 'string' },
                        tenant_context: { type: 'string' },
                        is_active: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' }
                      }
                    },
                    action: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/notifications/merge-device': {
      post: {
        tags: ['Notifications'],
        summary: 'Merge Device Subscription',
        description: 'Merge anonymous device subscription when user logs in',
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['deviceToken'],
                properties: {
                  deviceToken: {
                    type: 'string',
                    description: 'OneSignal player ID'
                  }
                }
              },
              examples: {
                default: {
                  value: {
                    deviceToken: 'onesignal_player_id_123'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Device subscription merged successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    merged: { type: 'boolean' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/notifications/send': {
      post: {
        tags: ['Notifications'],
        summary: 'Send Notification',
        description: 'Send any type of notification to a user',
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotificationSend'
              },
              examples: {
                default: {
                  value: {
                    userId: 'user_123',
                    eventType: 'chat_request',
                    message: 'Someone wants to chat about your listing.',
                    link: 'https://platform.com/entity/123/chat',
                    tenantContext: 'default',
                    eventPayload: {
                      entity_id: 'entity_123',
                      requester_id: 'user_456'
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Notification sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        user_id: { type: 'string' },
                        event_type: { type: 'string' },
                        message: { type: 'string' },
                        link: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' }
                      }
                    },
                    pushSent: { type: 'boolean' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/notifications/chat-request': {
      post: {
        tags: ['Notifications'],
        summary: 'Chat Request Notification',
        description: 'Specialized endpoint for chat requests to entity owners',
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ChatRequest'
              },
              examples: {
                default: {
                  value: {
                    entityId: 'entity_123',
                    chatUrl: 'https://platform.com/entity/123/chat'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Chat request notification sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        user_id: { type: 'string' },
                        event_type: { type: 'string' },
                        message: { type: 'string' },
                        link: { type: 'string' }
                      }
                    },
                    pushSent: { type: 'boolean' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/notifications/preferences': {
      get: {
        tags: ['Notifications'],
        summary: 'Get Notification Preferences',
        description: 'Get user\'s notification preferences',
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'User notification preferences',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    preferences: {
                      type: 'object',
                      properties: {
                        chat_requests: { type: 'boolean' },
                        attribute_updates: { type: 'boolean' },
                        reminders: { type: 'boolean' },
                        marketing: { type: 'boolean' }
                      }
                    },
                    userId: { type: 'string' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Notifications'],
        summary: 'Update Notification Preferences',
        description: 'Update user\'s notification preferences',
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotificationPreferences'
              },
              examples: {
                default: {
                  value: {
                    preferences: {
                      chat_requests: true,
                      attribute_updates: false,
                      reminders: true,
                      marketing: false
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Preferences updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        user_id: { type: 'string' },
                        preferences: {
                          type: 'object',
                          properties: {
                            chat_requests: { type: 'boolean' },
                            attribute_updates: { type: 'boolean' },
                            reminders: { type: 'boolean' },
                            marketing: { type: 'boolean' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/notifications/history': {
      get: {
        tags: ['Notifications'],
        summary: 'Get Notification History',
        description: 'Get user\'s notification history with pagination',
        security: [
          {
            bearerAuth: []
          }
        ],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              default: 1
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: {
              type: 'integer',
              default: 20
            }
          }
        ],
        responses: {
          '200': {
            description: 'Notification history',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    notifications: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          event_type: { type: 'string' },
                          message: { type: 'string' },
                          link: { type: 'string' },
                          event_payload: { type: 'object' },
                          seen: { type: 'boolean' },
                          timestamp: { type: 'string', format: 'date-time' }
                        }
                      }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        has_more: { type: 'boolean' }
                      }
                    },
                    userId: { type: 'string' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/notifications/{id}/seen': {
      post: {
        tags: ['Notifications'],
        summary: 'Mark Notification as Seen',
        description: 'Mark a specific notification as seen',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Notification ID',
            schema: {
              type: 'string'
            }
          }
        ],
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'Notification marked as seen',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        seen: { type: 'boolean' },
                        updated_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '404': {
            description: 'Notification not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/notifications/test': {
      post: {
        tags: ['Notifications'],
        summary: 'Test Notification',
        description: 'Send a test notification to the authenticated user',
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'Test notification sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        event_type: { type: 'string' },
                        message: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' }
                      }
                    },
                    pushSent: { type: 'boolean' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/interaction_logs': {
      post: {
        tags: ['System'],
        summary: 'Log Interaction',
        description: 'Manually log an interaction event',
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/InteractionLog'
              },
              examples: {
                default: {
                  value: {
                    eventType: 'custom_event',
                    entityId: 'entity-uuid',
                    eventPayload: {
                      custom_data: 'value',
                      source: 'manual'
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Interaction logged successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    logged_at: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = openApiSchema;