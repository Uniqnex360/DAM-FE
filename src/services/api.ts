import { supabase } from '../lib/supabase';
import { cloudinary } from './cloudinary';

export interface UploadResponse {
  uploadId: string;
  images: Array<{ id: string; url: string; cloudinaryUrl?: string }>;
  status: string;
}

export interface JobResponse {
  jobId: string;
  status: string;
  [key: string]: any;
}

export const api = {
  async ensureProfile() {
    const user = (await supabase.auth.getUser()).data.user;
    console.log("USERRRRR",user)
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email!,
        role: 'client'
      });
    }
  },
  // Alternative Safe Version using standard fetch
  async proxyUrlToFile(url: string, filename: string): Promise<File> {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    // Your project URL
    const PROJECT_REF = import.meta.env.VITE_SUPABASE_URL; 
    const functionUrl = `${PROJECT_REF}/functions/v1/fetch-url`;

    const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
    });

    if (!res.ok) throw new Error("Proxy fetch failed");
    
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  },
  async uploadImages(files: File[], productId?: string): Promise<UploadResponse> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    await this.ensureProfile();

    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .insert({ user_id: user.id, product_id: productId, status: 'uploaded' })
      .select()
      .single();

    if (uploadError) throw uploadError;

    const uploadedImages = [];

    for (const file of files) {
      const filePath = `${user.id}/${upload.id}/${file.name}`;
      const { error: storageError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (storageError) {
        console.error('Storage error:', storageError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      let cloudinaryData = null;
      if (cloudinary.isConfigured()) {
        try {
          cloudinaryData = await cloudinary.uploadImage(file, {
            folder: `furniture-visualizer/${user.id}`,
            tags: ['upload', upload.id]
          });
        } catch (error) {
          console.error('Cloudinary upload error:', error);
        }
      }

      const { data: image, error: imageError } = await supabase
        .from('images')
        .insert({
          upload_id: upload.id,
          user_id: user.id,
          url: urlData.publicUrl,
          cloudinary_public_id: cloudinaryData?.public_id,
          processed_url: cloudinaryData?.secure_url
        })
        .select()
        .single();

      if (!imageError && image) {
        uploadedImages.push({
          id: image.id,
          url: image.url,
          cloudinaryUrl: cloudinaryData?.secure_url
        });
      }
    }

    return {
      uploadId: upload.id,
      images: uploadedImages,
      status: 'uploaded'
    };
  },
  async processImageAI(imageId:string,imageUrl:string,operation: 'bg-remove' | 'resize' | 'compress' | '3d-model',originalName?:string,options?: any)
  {
    const {data,error}=await supabase.functions.invoke('process-image',{
      body:{
        imageId,imageUrl,operation,originalName,options
      }
    })
    if(error)
    {
      console.error("Edge function error",error)
      throw error
    }
    return data
  },
  async createSegmentationJob(uploadId: string, options: any): Promise<JobResponse> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        type: 'segment',
        status: 'pending',
        input_data: { uploadId, options }
      })
      .select()
      .single();

    if (error) throw error;

    return {
      jobId: job.id,
      status: job.status
    };
  },

  async createStainJob(uploadId: string, targetColor: string, options: any): Promise<JobResponse> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        type: 'stain',
        status: 'pending',
        input_data: { uploadId, targetColor, options }
      })
      .select()
      .single();

    if (error) throw error;

    return {
      jobId: job.id,
      status: job.status
    };
  },

  async create3DJob(uploadId: string, mode: string, options: any): Promise<JobResponse> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        type: '3d',
        status: 'pending',
        input_data: { uploadId, mode, options }
      })
      .select()
      .single();

    if (error) throw error;

    return {
      jobId: job.id,
      status: job.status
    };
  },

  async createRenderJob(modelId: string, options: any): Promise<JobResponse> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        type: 'render',
        status: 'pending',
        input_data: { modelId, options }
      })
      .select()
      .single();

    if (error) throw error;

    return {
      jobId: job.id,
      status: job.status
    };
  },

  async getJob(jobId: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  },

  async getJobs() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProducts() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProduct(productId: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_components (*),
        models_3d (*)
      `)
      .eq('id', productId)
      .single();

    if (error) throw error;
    return data;
  },

  async getStains() {
    const { data, error } = await supabase
      .from('stain_library')
      .select('*')
      .eq('is_public', true)
      .order('name');

    if (error) throw error;
    return data;
  },

  async createProduct(product: any) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('products')
      .insert({ ...product, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProduct(productId: string, updates: any) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadFromUrls(urls: string[], productId?: string): Promise<UploadResponse> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    await this.ensureProfile();

    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .insert({ user_id: user.id, product_id: productId, status: 'uploaded', metadata: { source: 'urls' } })
      .select()
      .single();

    if (uploadError) throw uploadError;

    const uploadedImages = [];

    for (const url of urls) {
      const { data: image, error: imageError } = await supabase
        .from('images')
        .insert({
          upload_id: upload.id,
          user_id: user.id,
          url: url
        })
        .select()
        .single();

      if (!imageError && image) {
        uploadedImages.push({ id: image.id, url: image.url });
      }
    }

    return {
      uploadId: upload.id,
      images: uploadedImages,
      status: 'uploaded'
    };
  },

  async uploadFromProductPage(pageUrl: string, productId?: string): Promise<UploadResponse> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    await this.ensureProfile();

    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        product_id: productId,
        status: 'processing',
        metadata: { source: 'product_page', url: pageUrl }
      })
      .select()
      .single();

    if (uploadError) throw uploadError;

    const job = await this.createJob('extract', { uploadId: upload.id, pageUrl });

    return {
      uploadId: upload.id,
      images: [],
      status: 'processing'
    };
  },

  async uploadFromCloudStorage(provider: string, path: string, productId?: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    await this.ensureProfile();

    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        product_id: productId,
        status: 'processing',
        metadata: { source: provider, path }
      })
      .select()
      .single();

    if (uploadError) throw uploadError;

    return {
      uploadId: upload.id,
      images: [],
      status: 'processing'
    };
  },

  async createJob(type: string, inputData: any): Promise<JobResponse> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    await this.ensureProfile();

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        type: type as any,
        status: 'pending',
        input_data: inputData
      })
      .select()
      .single();

    if (error) throw error;

    return {
      jobId: job.id,
      status: job.status
    };
  },

  async createBatchProcessingJob(uploadId: string, imageProcessing: Record<string, string[]>) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    await this.ensureProfile();

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        type: 'segment',
        status: 'pending',
        input_data: {
          uploadId,
          imageProcessing,
          batchMode: true
        }
      })
      .select()
      .single();

    if (error) throw error;

    return {
      jobId: job.id,
      status: job.status
    };
  },
  // Inside your `export const api = { ... }`
async generateInfographicFromImage(file: File): Promise<{
  imageUrl: string;
  analysis: any;
}> {
  // Convert file to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

  // Get Supabase session for auth
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL;
  const functionUrl = `${PROJECT_URL}/functions/v1/analyze-and-generate-poster`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64: base64 }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Infographic generation failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.imageUrl) {
    throw new Error('No image URL returned from infographic generator');
  }

  return {
    imageUrl: result.imageUrl,
    analysis: result.analysis || {},
  };
},
  async processImageWithCloudinary(
    imageId: string,
    operationType: string,
    transformations: any = {}
  ) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    await this.ensureProfile();

    const { data: image } = await supabase
      .from('images')
      .select('url, cloudinary_public_id')
      .eq('id', imageId)
      .maybeSingle();

    if (!image) throw new Error('Image not found');

    const startTime = Date.now();

    const { data: operation, error: opError } = await supabase
      .from('image_processing_operations')
      .insert({
        user_id: user.id,
        image_id: imageId,
        operation_type: operationType,
        status: 'processing',
        input_url: image.url,
        parameters: transformations
      })
      .select()
      .single();

    if (opError) throw opError;

    try {
      let processedUrl = null;
      let cloudinaryPublicId = image.cloudinary_public_id;

      if (cloudinary.isConfigured() && cloudinaryPublicId) {
        processedUrl = cloudinary.getTransformedUrl(cloudinaryPublicId, transformations);
      }

      const processingTime = Date.now() - startTime;

      await supabase
        .from('image_processing_operations')
        .update({
          status: 'completed',
          output_url: processedUrl,
          cloudinary_public_id: cloudinaryPublicId,
          processing_time_ms: processingTime,
          completed_at: new Date().toISOString()
        })
        .eq('id', operation.id);

      await supabase
        .from('images')
        .update({
          processing_status: 'completed',
          processed_url: processedUrl,
          operations_applied: supabase.rpc('jsonb_append', {
            target: 'operations_applied',
            value: operationType
          })
        })
        .eq('id', imageId);

      return {
        operationId: operation.id,
        processedUrl,
        status: 'completed'
      };
    } catch (error: any) {
      await supabase
        .from('image_processing_operations')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', operation.id);

      throw error;
    }
  }
};

