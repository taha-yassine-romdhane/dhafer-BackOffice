// lib/imagekit-config.ts
import ImageKit from "imagekit";

// Configuration Type
interface ImageKitConfig {
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
}

// Export configuration for client-side
export const imagekitConfig: Omit<ImageKitConfig, 'privateKey'> = {
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
};

// Create ImageKit instance for server-side
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
});

export default imagekit;