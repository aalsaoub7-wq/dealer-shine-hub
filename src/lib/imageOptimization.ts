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
  options?: { width?: number; height?: number; quality?: number }
): string {
  // Default options
  const { width = 800, quality = 75 } = options || {};
  
  // Only optimize Supabase Storage URLs
  if (!url || !url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }
  
  // Convert object → render/image and add parameters
  const optimizedUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );
  
  return `${optimizedUrl}?width=${width}&quality=${quality}`;
}
