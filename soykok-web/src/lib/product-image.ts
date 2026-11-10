/**
 * Ürün görseli adresi. İki tür değer olabilir:
 *   "laminat-1.jpg"                    → public/images/products altındaki hazır görseller
 *   "/api/files/products/0193....jpg"  → admin panelinden yüklenen görseller (API sunar)
 */
export function productImageSrc(image: string): string {
  return image.startsWith('/') || /^https?:\/\//.test(image) ? image : `/images/products/${image}`;
}

/**
 * Yüklenen görseller API'den geldiği için Next.js görsel optimizasyonundan geçirilmez
 * (<Image unoptimized>); hazır görseller optimize edilmeye devam eder.
 */
export function isUploadedImage(image: string): boolean {
  return !productImageSrc(image).startsWith('/images/');
}
