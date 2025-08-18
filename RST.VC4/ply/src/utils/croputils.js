export const getCroppedImg = async (imageSrc, cropPixels, maxSize) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropWidth = cropPixels.width * scaleX;
    const cropHeight = cropPixels.height * scaleY;

    const finalWidth = Math.min(cropWidth, maxSize);
    const finalHeight = Math.min(cropHeight, maxSize);

    canvas.width = finalWidth;
    canvas.height = finalHeight;

    ctx.drawImage(
        image,
        cropPixels.x * scaleX,
        cropPixels.y * scaleY,
        cropWidth,
        cropHeight,
        0,
        0,
        finalWidth,
        finalHeight
    );

    return canvas.toDataURL('image/png');
};

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', (err) => reject(err));
        img.setAttribute('crossOrigin', 'anonymous');
        img.src = url;
    });