/**
 * Lee una imagen elegida por el usuario y la devuelve achicada como JPEG (data URL),
 * para que pese poco al guardarla en el navegador. Se recorta con CSS al mostrarla.
 */
export async function fileToCoverDataUrl(
    file: File,
    maxWidth = 900,
    maxHeight = 900,
    quality = 0.82
  ): Promise<string> {
    if (!file.type.startsWith("image/")) {
      throw new Error("The selected file is not an image.");
    }
  
    const objectUrl = URL.createObjectURL(file);
  
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
  
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("The image could not be read."));
        element.src = objectUrl;
      });
  
      const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
      const canvas = document.createElement("canvas");
  
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
  
      const context = canvas.getContext("2d");
  
      if (!context) {
        throw new Error("The image could not be processed.");
      }
  
      // Fondo blanco para PNG con transparencia
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
  
      return canvas.toDataURL("image/jpeg", quality);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }