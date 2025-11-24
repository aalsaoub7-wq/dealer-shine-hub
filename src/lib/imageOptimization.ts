/**
 * Optimizes Supabase Storage image URLs by converting them to render URLs
 * with specified dimensions and quality parameters.
 * 
 * @param url - The original Supabase Storage URL
 * @param options - Optional width, height, and quality parameters
 * @returns Optimized image URL with transformation parameters
 */
export function getOptimizedImageUrl(
  url: string,
  options?: { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' }
): string {
  // Default options
  const { width = 800, height, quality = 75, resize = 'cover' } = options || {};
  
  // Only optimize Supabase Storage URLs
  if (!url || !url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }
  
  // Convert object → render/image and add parameters
  const optimizedUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );
  
  let params = `width=${width}&quality=${quality}&resize=${resize}`;
  if (height) {
    params += `&height=${height}`;
  }
  
  return `${optimizedUrl}?${params}`;
}
