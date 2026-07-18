/**
 * Kullanıcı tarafından seçilen resmi kırpmak, 400x400 piksele boyutlandırmak
 * ve JPEG formatında sıkıştırarak Blob haline getirmek için kullanılan yardımcı fonksiyonlar.
 */

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // CORS hatalarını önlemek için
    image.src = url;
  });

/**
 * Resmi canvas kullanarak kırpar, 400x400 piksele ölçeklendirir ve sıkıştırır.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Çıkış resmi boyutu her zaman 400x400 piksel (Vesikalık/Sosyal medya standardı) olacak
  const targetSize = 400;
  canvas.width = targetSize;
  canvas.height = targetSize;

  // Kırpılan bölgeyi canvas'a 400x400 olacak şekilde çiz
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetSize,
    targetSize
  );

  // Görseli JPEG olarak ve %85 kalitede sıkıştırarak dışa aktar
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/jpeg',
      0.85
    );
  });
}
