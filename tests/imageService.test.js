const request = require('supertest');
const sharp = require('sharp');
const ImageService = require('../src/services/image');
const { createClient } = require('@supabase/supabase-js');

// Mock sharp module
jest.mock('sharp');

// Mock Supabase client
jest.mock('@supabase/supabase-js');

describe('Image Service Sharp Error Tests', () => {
  let imageService;
  let mockSupabaseClient;
  let mockDBService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Supabase client
    mockSupabaseClient = {
      storage: {
        listBuckets: jest.fn().mockResolvedValue({ data: [] }),
        createBucket: jest.fn().mockResolvedValue({ data: {}, error: null }),
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
          getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } })
        })
      },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
          })
        })
      })
    };
    
    createClient.mockReturnValue(mockSupabaseClient);
    
    // Mock database service
    mockDBService = {
      table: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
          })
        })
      })
    };
    
    imageService = new ImageService(mockDBService);
  });

  test('should call Supabase upload even when Sharp fails', async () => {
    // Mock sharp to throw error on resize
    sharp.mockImplementation(() => {
      return {
        resize: jest.fn().mockImplementation(() => {
          throw new Error('Simulated Sharp error');
        }),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(new Error('Simulated Sharp error'))
      };
    });
    
    const fileBuffer = Buffer.from('fake image data');
    const originalName = 'test.jpg';
    const entityId = 'entity-123';
    const tenantId = 'tenant-456';
    const userId = 'user-789';
    const mimetype = 'image/jpeg';
    
    const result = await imageService.uploadImage(fileBuffer, originalName, entityId, tenantId, userId, mimetype);
    
    // Assert Supabase upload was called (for original and fallback images)
    expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('entity-images');
    const uploadMethod = mockSupabaseClient.storage.from().upload;
    expect(uploadMethod).toHaveBeenCalled();
    
    // Check result structure
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.urls).toBeDefined();
    
    // Check that original is not fallback
    expect(result.data.urls.original.is_fallback).toBe(false);
    
    // Check that size-specific URLs are marked as fallback when Sharp fails
    const sizeKeys = Object.keys(result.data.urls).filter(key => key !== 'original');
    sizeKeys.forEach(size => {
      expect(result.data.urls[size].is_fallback).toBe(true);
    });
  });

  test('file_urls should contain valid URLs marked with fallback:true when Sharp fails', async () => {
    // Mock sharp to fail
    sharp.mockImplementation(() => {
      return {
        resize: jest.fn().mockImplementation(() => {
          throw new Error('Simulated Sharp error');
        }),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(new Error('Simulated Sharp error'))
      };
    });
    
    const fileBuffer = Buffer.from('fake image data');
    const result = await imageService.uploadImage(
      fileBuffer, 
      'test.jpg', 
      'entity-123', 
      'tenant-456', 
      'user-789', 
      'image/jpeg'
    );
    
    // Verify file_urls structure
    expect(result.data.urls).toBeDefined();
    
    // Check that all URLs are valid and contain the expected properties
    Object.entries(result.data.urls).forEach(([size, urlData]) => {
      expect(urlData.url).toBeTruthy();
      expect(urlData.url).toMatch(/^https?:\/\//); // Valid URL format
      expect(urlData.path).toBeTruthy();
      expect(typeof urlData.is_fallback).toBe('boolean');
      
      // Original should not be fallback, others should be when Sharp fails
      if (size === 'original') {
        expect(urlData.is_fallback).toBe(false);
      } else {
        expect(urlData.is_fallback).toBe(true);
      }
    });
  });

  test('should verify Supabase upload is called multiple times when Sharp fails', async () => {
    // Mock sharp to fail
    sharp.mockImplementation(() => {
      return {
        resize: jest.fn().mockImplementation(() => {
          throw new Error('Simulated Sharp error');
        }),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(new Error('Simulated Sharp error'))
      };
    });
    
    const fileBuffer = Buffer.from('fake image data');
    const result = await imageService.uploadImage(
      fileBuffer, 
      'test.jpg', 
      'entity-123', 
      'tenant-456', 
      'user-789', 
      'image/jpeg'
    );
    
    // Verify that Supabase upload was called (should be 5 times: 1 original + 4 sizes)
    const uploadMethod = mockSupabaseClient.storage.from().upload;
    expect(uploadMethod).toHaveBeenCalledTimes(5); // 1 original + 4 optimized sizes
    
    // Verify that even with Sharp failures, we get a successful result
    expect(result.success).toBe(true);
    expect(result.data.urls).toBeDefined();
    
    // Check that we have all expected sizes
    expect(result.data.urls).toHaveProperty('original');
    expect(result.data.urls).toHaveProperty('thumbnail');
    expect(result.data.urls).toHaveProperty('small');
    expect(result.data.urls).toHaveProperty('medium');
    expect(result.data.urls).toHaveProperty('large');
  });

  test('should ensure fallback URLs are properly structured', async () => {
    // Mock sharp to fail
    sharp.mockImplementation(() => {
      return {
        resize: jest.fn().mockImplementation(() => {
          throw new Error('Simulated Sharp error');
        }),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(new Error('Simulated Sharp error'))
      };
    });
    
    const fileBuffer = Buffer.from('fake image data');
    const result = await imageService.uploadImage(
      fileBuffer, 
      'test.jpg', 
      'entity-123', 
      'tenant-456', 
      'user-789', 
      'image/jpeg'
    );
    
    // Verify the structure of file_urls
    const fileUrls = result.data.urls;
    
    Object.entries(fileUrls).forEach(([size, urlData]) => {
      // Each URL data should have required properties
      expect(urlData).toHaveProperty('url');
      expect(urlData).toHaveProperty('path');
      expect(urlData).toHaveProperty('size');
      expect(urlData).toHaveProperty('is_fallback');
      
      // URL should be a valid HTTP/HTTPS URL
      expect(urlData.url).toMatch(/^https?:\/\/.+/);
      
      // Path should be non-empty
      expect(urlData.path).toBeTruthy();
      
      // Size should be a number
      expect(typeof urlData.size).toBe('number');
      
      // is_fallback should be boolean
      expect(typeof urlData.is_fallback).toBe('boolean');
    });
  });
});

// Additional test to verify API-related functionality
describe('ImageService API Integration Checks', () => {
  let imageService;
  let mockSupabaseClient;
  let mockDBService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Supabase client
    mockSupabaseClient = {
      storage: {
        listBuckets: jest.fn().mockResolvedValue({ data: [] }),
        createBucket: jest.fn().mockResolvedValue({ data: {}, error: null }),
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
          getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } })
        })
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'test-image-id',
                    original_name: 'test.jpg',
                    label: null,
                    file_urls: {
                      original: {
                        url: 'https://example.com/original.jpg',
                        path: 'tenant/entity/image/original.jpg',
                        is_fallback: false
                      },
                      thumbnail: {
                        url: 'https://example.com/thumbnail.jpg',
                        path: 'tenant/entity/image/thumbnail.jpg',
                        is_fallback: true
                      },
                      small: {
                        url: 'https://example.com/small.jpg',
                        path: 'tenant/entity/image/small.jpg',
                        is_fallback: true
                      }
                    },
                    uploaded_by: 'test-user',
                    created_at: new Date().toISOString()
                  }
                ],
                error: null
              })
            })
          })
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
          })
        })
      })
    };
    
    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValue(mockSupabaseClient);
    
    // Mock database service
    mockDBService = {
      table: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
          })
        })
      })
    };
    
    imageService = new ImageService(mockDBService);
  });

  test('getEntityImages should return non-empty URLs for API endpoint', async () => {
    const entityId = 'test-entity-123';
    const tenantId = 'test-tenant-456';
    
    const result = await imageService.getEntityImages(entityId, tenantId);
    
    // Should return success
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    
    // Check each image has required properties and URLs
    result.data.forEach(image => {
      expect(image.file_urls).toBeDefined();
      expect(image.file_urls.original).toBeDefined();
      expect(image.file_urls.original.url).toBeTruthy();
      expect(image.file_urls.original.url).toMatch(/^https?:\/\//);
      expect(image.file_urls.original.is_fallback).toBe(false);
      
      // Check fallback URLs for other sizes
      const fallbackSizes = Object.keys(image.file_urls).filter(key => key !== 'original');
      fallbackSizes.forEach(size => {
        expect(image.file_urls[size].url).toBeTruthy();
        expect(image.file_urls[size].url).toMatch(/^https?:\/\//);
        expect(image.file_urls[size].is_fallback).toBe(true);
      });
    });
  });

  test('getImageUrl should return valid URLs for different sizes', async () => {
    const mockImageRecord = {
      file_urls: {
        original: {
          url: 'https://example.com/original.jpg',
          is_fallback: false
        },
        thumbnail: {
          url: 'https://example.com/thumbnail.jpg',
          is_fallback: true
        },
        medium: {
          url: 'https://example.com/medium.jpg',
          is_fallback: true
        }
      }
    };
    
    // Test getting different sizes
    expect(imageService.getImageUrl(mockImageRecord, 'original')).toBe('https://example.com/original.jpg');
    expect(imageService.getImageUrl(mockImageRecord, 'thumbnail')).toBe('https://example.com/thumbnail.jpg');
    expect(imageService.getImageUrl(mockImageRecord, 'medium')).toBe('https://example.com/medium.jpg');
    
    // Test fallback to original when size not available
    expect(imageService.getImageUrl(mockImageRecord, 'nonexistent')).toBe('https://example.com/original.jpg');
  });
});

