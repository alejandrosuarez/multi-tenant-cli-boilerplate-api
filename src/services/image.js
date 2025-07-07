const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const crypto = require('crypto');

class ImageService {
  constructor(databaseService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.db = databaseService;
    this.bucketName = 'entity-images';
    
    // Image optimization settings (free tier friendly)
    this.sizes = {
      thumbnail: { width: 150, height: 150, quality: 80 },
      small: { width: 400, height: 400, quality: 85 },
      medium: { width: 800, height: 600, quality: 90 },
      large: { width: 1200, height: 900, quality: 95 }
    };
  }

  // Initialize storage bucket if it doesn't exist
  async initializeBucket() {
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        const { data, error } = await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB limit
        });
        
        if (error) {
          console.error('Bucket creation error:', error);
          return { success: false, error: error.message };
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Bucket initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  // Optimize image for different sizes
  async optimizeImage(buffer, size = 'medium') {
    try {
      const config = this.sizes[size] || this.sizes.medium;
      
      const optimized = await sharp(buffer)
        .resize(config.width, config.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: config.quality, progressive: true })
        .toBuffer();

      return { success: true, buffer: optimized };
    } catch (error) {
      console.error('Image optimization error:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate unique filename
  generateFilename(originalName, size = 'original') {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = originalName.split('.').pop().toLowerCase();
    return `${timestamp}_${random}_${size}.${ext}`;
  }

  // Upload single image with multiple sizes
  async uploadImage(fileBuffer, originalName, entityId, tenantId, userId, label = null) {
    try {
      // Initialize bucket if needed
      await this.initializeBucket();

      const imageId = crypto.randomUUID();
      const basePath = `${tenantId}/${entityId}`;
      const uploadResults = {};

      // Upload original and optimized versions
      for (const [sizeName, config] of Object.entries(this.sizes)) {
        const optimized = await this.optimizeImage(fileBuffer, sizeName);
        
        if (!optimized.success) {
          continue; // Skip this size if optimization fails
        }

        const filename = this.generateFilename(originalName, sizeName);
        const filePath = `${basePath}/${imageId}/${filename}`;

        const { data, error } = await this.supabase.storage
          .from(this.bucketName)
          .upload(filePath, optimized.buffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600'
          });

        if (error) {
          console.error(`Upload error for ${sizeName}:`, error);
          continue;
        }

        // Get public URL
        const { data: urlData } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(filePath);

        uploadResults[sizeName] = {
          path: filePath,
          url: urlData.publicUrl,
          size: optimized.buffer.length
        };
      }

      // Store metadata in database
      const imageRecord = {
        id: imageId,
        entity_id: entityId,
        tenant_id: tenantId,
        uploaded_by: userId,
        original_name: originalName,
        label: label,
        file_urls: uploadResults,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert into database (we'll need to create this table)
      const { data: dbResult, error: dbError } = await this.supabase
        .from('mtcli_entity_images')
        .insert([imageRecord])
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Clean up uploaded files if DB insert fails
        await this.deleteImageFiles(imageId, tenantId, entityId);
        return { success: false, error: 'Failed to save image metadata' };
      }

      return {
        success: true,
        data: {
          id: imageId,
          urls: uploadResults,
          metadata: {
            originalName,
            label,
            entityId,
            tenantId,
            uploadedBy: userId,
            createdAt: imageRecord.created_at
          }
        }
      };

    } catch (error) {
      console.error('Image upload error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get images for an entity
  async getEntityImages(entityId, tenantId) {
    try {
      const { data, error } = await this.supabase
        .from('mtcli_entity_images')
        .select('*')
        .eq('entity_id', entityId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get images error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete image and all its variants
  async deleteImage(imageId, userId, tenantId) {
    try {
      // Get image record first
      const { data: imageRecord, error: fetchError } = await this.supabase
        .from('mtcli_entity_images')
        .select('*')
        .eq('id', imageId)
        .eq('tenant_id', tenantId)
        .single();

      if (fetchError || !imageRecord) {
        return { success: false, error: 'Image not found' };
      }

      // Check ownership
      if (imageRecord.uploaded_by !== userId) {
        return { success: false, error: 'Unauthorized to delete this image' };
      }

      // Delete files from storage
      const deleteResult = await this.deleteImageFiles(
        imageId, 
        tenantId, 
        imageRecord.entity_id
      );

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('mtcli_entity_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        return { success: false, error: 'Failed to delete image record' };
      }

      return { success: true, message: 'Image deleted successfully' };
    } catch (error) {
      console.error('Delete image error:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper to delete image files from storage
  async deleteImageFiles(imageId, tenantId, entityId) {
    try {
      const basePath = `${tenantId}/${entityId}/${imageId}`;
      
      // List all files in the image directory
      const { data: files, error: listError } = await this.supabase.storage
        .from(this.bucketName)
        .list(`${tenantId}/${entityId}`, {
          search: imageId
        });

      if (listError) {
        console.error('List files error:', listError);
        return { success: false, error: listError.message };
      }

      // Delete all files
      if (files && files.length > 0) {
        const filePaths = files.map(file => `${tenantId}/${entityId}/${file.name}`);
        
        const { error: deleteError } = await this.supabase.storage
          .from(this.bucketName)
          .remove(filePaths);

        if (deleteError) {
          console.error('Delete files error:', deleteError);
          return { success: false, error: deleteError.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Delete image files error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get optimized image URL with size parameter
  getImageUrl(imageRecord, size = 'medium') {
    if (!imageRecord.file_urls || !imageRecord.file_urls[size]) {
      // Fallback to available size
      const availableSizes = Object.keys(imageRecord.file_urls || {});
      if (availableSizes.length > 0) {
        size = availableSizes[0];
      } else {
        return null;
      }
    }

    return imageRecord.file_urls[size]?.url || null;
  }

  // Get all available sizes for an image
  getAvailableSizes(imageRecord) {
    return Object.keys(imageRecord.file_urls || {});
  }

  // Health check for image service
  async healthCheck() {
    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets();
      
      if (error) {
        return { status: 'error', message: error.message };
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
      
      return {
        status: bucketExists ? 'healthy' : 'bucket_missing',
        bucketName: this.bucketName,
        availableSizes: Object.keys(this.sizes)
      };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

module.exports = ImageService;