export const readFilesAsDataUrls = async (files) => {
  const list = Array.from(files || []).slice(0, 5);
  const images = [];
  for (const file of list) {
    const img = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    images.push(img);
  }
  return images.filter((s) => typeof s === 'string' && s.startsWith('data:image/'));
};

