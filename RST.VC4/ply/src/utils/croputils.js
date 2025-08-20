export const scaleImageToFit = async (imageSrc, maxWidth, maxHeight) => {
    const image = new Image();
    image.src = imageSrc;
    await image.decode();

    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const canvas = document.createElement('canvas');
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/png');
};

export const getCroppedImg = async (imageSrc, cropPixels, maxWidth, maxHeight) => {
    const image = new Image();
    image.src = imageSrc;
    await image.decode();

    const canvas = document.createElement('canvas');
    const scale = Math.min(maxWidth / cropPixels.width, maxHeight / cropPixels.height, 1);

    canvas.width = cropPixels.width * scale;
    canvas.height = cropPixels.height * scale;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return canvas.toDataURL('image/png');
};