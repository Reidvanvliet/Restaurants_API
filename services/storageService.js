const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');

class StorageService {
  constructor() {
    console.log('🚀 StorageService constructor called');
    console.log('📦 Multer available:', typeof multer);
    console.log('📦 Google Cloud Storage available:', typeof Storage);
    
    this.storage = null;
    this.bucket = null;
    this.bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
    this.initializeStorage();
  }

  initializeStorage() {
    try {
      console.log('🔧 Initializing Google Cloud Storage...');
      console.log('Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
      console.log('Bucket Name:', this.bucketName);
      console.log('Key File:', process.env.GOOGLE_CLOUD_KEY_FILE);
      
      // Check if Google Cloud credentials are configured
      if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !this.bucketName) {
        console.warn('⚠️  Google Cloud Storage not configured. Image upload will be disabled.');
        console.warn('Missing PROJECT_ID:', !process.env.GOOGLE_CLOUD_PROJECT_ID);
        console.warn('Missing BUCKET_NAME:', !this.bucketName);
        return;
      }

      // Initialize Google Cloud Storage
      const storageConfig = {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      };

      // If using service account key file
      if (process.env.GOOGLE_CLOUD_KEY_FILE) {
        storageConfig.keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE;
      }
      // If using service account key JSON string
      else if (process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
        storageConfig.credentials = {
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
      }

      this.storage = new Storage(storageConfig);
      this.bucket = this.storage.bucket(this.bucketName);

      console.log('☁️  Google Cloud Storage initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Cloud Storage:', error.message);
      this.storage = null;
      this.bucket = null;
    }
  }

  // Configure multer for memory storage
  getMulterConfig() {
    console.log('🔧 Creating multer configuration...');
    try {
      const config = multer({
        storage: multer.memoryStorage(),
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB limit
        },
        fileFilter: (req, file, cb) => {
          console.log('📁 File filter check:', file.mimetype);
          // Check if file is an image
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Only image files are allowed'), false);
          }
        },
      });
      console.log('✅ Multer configuration created successfully');
      return config;
    } catch (error) {
      console.error('❌ Error creating multer configuration:', error);
      throw error;
    }
  }

  // Upload image to Google Cloud Storage
  async uploadImage(file, folder = 'menu-items') {
    try {
      console.log('☁️ uploadImage called with file:', { name: file.originalname, size: file.size });
      
      if (!this.bucket) {
        console.log('❌ Bucket not available');
        throw new Error('Google Cloud Storage not configured');
      }
      console.log('✅ Bucket is available');

      // Generate unique filename
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const filename = `${folder}/${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      console.log('📝 Generated filename:', filename);

      // Create file object in bucket
      const fileUpload = this.bucket.file(filename);
      console.log('📁 File object created in bucket');

      // Create upload stream
      console.log('🚰 Creating upload stream...');
      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        }
      });
      console.log('✅ Upload stream created');

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          console.error('❌ Upload stream error:', error);
          reject(error);
        });

        stream.on('finish', async () => {
          console.log('🏁 Upload stream finished');
          try {
            // Make the file publicly accessible
            console.log('🌐 Making file public...');
            
            // Get the public URL
            const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${filename}`;
            
            console.log(`📷 Image uploaded successfully: ${publicUrl}`);
            resolve({
              filename: filename,
              url: publicUrl,
              size: file.size,
              mimetype: file.mimetype
            });
          } catch (error) {
            console.error('❌ Error making file public:', error);
            reject(error);
          }
        });

        // Write file buffer to stream
        console.log('📝 Writing file buffer to stream...');
        stream.end(file.buffer);
        console.log('✅ File buffer written to stream');
      });
    } catch (error) {
      console.error('Upload image error:', error);
      throw error;
    }
  }

  // Delete image from Google Cloud Storage
  async deleteImage(filename) {
    try {
      if (!this.bucket) {
        throw new Error('Google Cloud Storage not configured');
      }

      const file = this.bucket.file(filename);
      await file.delete();
      
      console.log(`🗑️  Image deleted successfully: ${filename}`);
      return true;
    } catch (error) {
      console.error('Delete image error:', error);
      // Don't throw error if file doesn't exist
      if (error.code === 404) {
        console.warn(`File not found for deletion: ${filename}`);
        return true;
      }
      throw error;
    }
  }

  // Extract filename from URL
  extractFilenameFromUrl(url) {
    try {
      if (!url || !url.includes('storage.googleapis.com')) {
        return null;
      }
      
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === this.bucketName);
      
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        return urlParts.slice(bucketIndex + 1).join('/');
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting filename from URL:', error);
      return null;
    }
  }

  // Check if storage is available
  isAvailable() {
    return this.storage !== null && this.bucket !== null;
  }
}

module.exports = new StorageService();