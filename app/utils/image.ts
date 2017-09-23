export const rgba2url = async (
  rgba: Uint8Array,
  width: number,
  height: number
): Promise<string | void> => {
  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  let ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  let imgData = ctx.createImageData(width, height);
  for (let i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i + 0] = rgba[i];
    imgData.data[i + 1] = rgba[i + 1];
    imgData.data[i + 2] = rgba[i + 2];
    imgData.data[i + 3] = rgba[i + 3];
  }
  ctx.putImageData(imgData, 0, 0);

  const blobUrl = await new Promise<string>(resolve => {
    canvas.toBlob(blob => {
      let url = URL.createObjectURL(blob);
      resolve(url);
    });
  });

  return blobUrl;
};
