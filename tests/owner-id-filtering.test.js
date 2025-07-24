const request = require('supertest');
const { createApp } = require('../src/index');

describe('Owner ID Filtering', () => {
  let app;
  let server;
  
  beforeAll(async () => {
    app = await createApp();
    server = app.server;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/entities with owner_id filter', () => {
    test('should return only entities owned by specific owner_id', async () => {
      const response = await request(server)
        .get('/api/entities?owner_id=dev-user')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body).toHaveProperty('entities');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('filters_applied');
      expect(response.body.filters_applied).toHaveProperty('owner_id', 'dev-user');

      // All returned entities should have the specified owner_id
      if (response.body.entities.length > 0) {
        response.body.entities.forEach(entity => {
          expect(entity.owner_id).toBe('dev-user');
        });
      }
    });

    test('should return empty results for non-existent owner_id', async () => {
      const response = await request(server)
        .get('/api/entities?owner_id=nonexistent@example.com')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body.entities).toHaveLength(0);
      expect(response.body.filters_applied).toHaveProperty('owner_id', 'nonexistent@example.com');
    });
  });

  describe('GET /api/entities with exclude_id filter', () => {
    test('should exclude specific entity by ID', async () => {
      // First, get all entities to find one to exclude
      const allEntitiesResponse = await request(server)
        .get('/api/entities')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      if (allEntitiesResponse.body.entities.length > 0) {
        const entityToExclude = allEntitiesResponse.body.entities[0];
        
        const response = await request(server)
          .get(`/api/entities?exclude_id=${entityToExclude.id}`)
          .set('Authorization', 'Bearer dev-token')
          .expect(200);

        expect(response.body).toHaveProperty('entities');
        expect(response.body.filters_applied).toHaveProperty('exclude_id', entityToExclude.id);

        // The excluded entity should not be in the results
        const excludedEntity = response.body.entities.find(entity => entity.id === entityToExclude.id);
        expect(excludedEntity).toBeUndefined();
      }
    });

    test('should return all entities when excluding non-existent ID', async () => {
      const response = await request(server)
        .get('/api/entities?exclude_id=999999')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body).toHaveProperty('entities');
      expect(response.body.filters_applied).toHaveProperty('exclude_id', '999999');
      // Should return normal results since the ID doesn't exist
    });
  });

  describe('GET /api/entities with combined owner_id and exclude_id filters', () => {
    test('should filter by owner and exclude specific entity', async () => {
      // First, get entities by a specific owner
      const ownerEntitiesResponse = await request(server)
        .get('/api/entities?owner_id=dev-user')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      if (ownerEntitiesResponse.body.entities.length > 0) {
        const entityToExclude = ownerEntitiesResponse.body.entities[0];
        
        const response = await request(server)
          .get(`/api/entities?owner_id=dev-user&exclude_id=${entityToExclude.id}`)
          .set('Authorization', 'Bearer dev-token')
          .expect(200);

        expect(response.body).toHaveProperty('entities');
        expect(response.body.filters_applied).toHaveProperty('owner_id', 'dev-user');
        expect(response.body.filters_applied).toHaveProperty('exclude_id', entityToExclude.id);

        // All entities should be owned by dev-user AND not include the excluded entity
        response.body.entities.forEach(entity => {
          expect(entity.owner_id).toBe('dev-user');
          expect(entity.id).not.toBe(entityToExclude.id);
        });
      }
    });
  });

  describe('GET /api/entities/search with owner_id filter', () => {
    test('should return only entities owned by specific owner_id', async () => {
      const response = await request(server)
        .get('/api/entities/search?owner_id=dev-user')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body).toHaveProperty('entities');
      expect(response.body).toHaveProperty('pagination');

      // All returned entities should have the specified owner_id
      if (response.body.entities.length > 0) {
        response.body.entities.forEach(entity => {
          expect(entity.owner_id).toBe('dev-user');
        });
      }
    });

    test('should combine owner_id filter with other search parameters', async () => {
      const response = await request(server)
        .get('/api/entities/search?owner_id=dev-user&limit=5')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body).toHaveProperty('entities');
      expect(response.body.entities.length).toBeLessThanOrEqual(5);

      // All returned entities should have the specified owner_id
      if (response.body.entities.length > 0) {
        response.body.entities.forEach(entity => {
          expect(entity.owner_id).toBe('dev-user');
        });
      }
    });
  });

  describe('GET /api/entities/search with exclude_id filter', () => {
    test('should exclude specific entity by ID in search', async () => {
      // First, get all entities to find one to exclude
      const allEntitiesResponse = await request(server)
        .get('/api/entities/search')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      if (allEntitiesResponse.body.entities.length > 0) {
        const entityToExclude = allEntitiesResponse.body.entities[0];
        
        const response = await request(server)
          .get(`/api/entities/search?exclude_id=${entityToExclude.id}`)
          .set('Authorization', 'Bearer dev-token')
          .expect(200);

        expect(response.body).toHaveProperty('entities');

        // The excluded entity should not be in the results
        const excludedEntity = response.body.entities.find(entity => entity.id === entityToExclude.id);
        expect(excludedEntity).toBeUndefined();
      }
    });
  });

  describe('GET /api/entities/search with combined filters', () => {
    test('should combine owner_id and exclude_id with search query', async () => {
      const response = await request(server)
        .get('/api/entities/search?owner_id=dev-user&exclude_id=123&q=test')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body).toHaveProperty('entities');
      expect(response.body).toHaveProperty('pagination');

      // All returned entities should have the specified owner_id and not include excluded ID
      response.body.entities.forEach(entity => {
        expect(entity.owner_id).toBe('dev-user');
        expect(entity.id).not.toBe('123');
      });
    });
  });

  describe('Pagination with owner filters', () => {
    test('should work with pagination parameters', async () => {
      const response = await request(server)
        .get('/api/entities?owner_id=dev-user&page=1&limit=2')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body).toHaveProperty('entities');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.entities.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);

      // All returned entities should have the specified owner_id
      response.body.entities.forEach(entity => {
        expect(entity.owner_id).toBe('dev-user');
      });
    });
  });

  describe('Error handling', () => {
    test('should handle empty owner_id parameter gracefully', async () => {
      const response = await request(server)
        .get('/api/entities?owner_id=')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body).toHaveProperty('entities');
      // Should not filter by owner_id when empty
    });

    test('should handle empty exclude_id parameter gracefully', async () => {
      const response = await request(server)
        .get('/api/entities?exclude_id=')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body).toHaveProperty('entities');
      // Should not exclude anything when empty
    });
  });

  describe('Access control with owner filtering', () => {
    test('should respect public_shareable flag when filtering by owner_id without auth', async () => {
      const response = await request(server)
        .get('/api/entities?owner_id=dev-user')
        .expect(200);

      expect(response.body).toHaveProperty('entities');
      
      // Without authentication, should only return public entities
      response.body.entities.forEach(entity => {
        expect(entity.public_shareable).toBe(true);
        expect(entity.owner_id).toBe('dev-user');
      });
    });

    test('should return private entities when authenticated user is the owner', async () => {
      const response = await request(server)
        .get('/api/entities?owner_id=dev-user')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body).toHaveProperty('entities');
      
      // With authentication as the owner, should return both public and private entities
      response.body.entities.forEach(entity => {
        expect(entity.owner_id).toBe('dev-user');
        // public_shareable can be true or false
      });
    });
  });
});