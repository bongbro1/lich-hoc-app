const IMGBB_API_KEY = '4b19f58fc08dff27c48d9728434fac5b';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

type ImgBBUploadResponse = {
    data?: {
        url?: string;
        display_url?: string;
    };
    success?: boolean;
    error?: {
        message?: string;
    };
};

const inferFileName = (uri: string, fallback: string) => {
    const cleanUri = uri.split('?')[0];
    return cleanUri.split('/').pop() || fallback;
};

const inferContentType = (uri: string) => {
    const extension = uri.split('?')[0].split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        case 'gif':
            return 'image/gif';
        case 'heic':
            return 'image/heic';
        case 'jpeg':
        case 'jpg':
        default:
            return 'image/jpeg';
    }
};

const isRemoteUrl = (uri: string) => /^https?:\/\//i.test(uri);

export const imgbbService = {
    async uploadImage(uri: string, name?: string) {
        if (!uri) {
            throw new Error('Image URI is required');
        }

        if (isRemoteUrl(uri)) {
            return uri;
        }

        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', {
            uri,
            name: name ?? inferFileName(uri, `chat_${Date.now()}.jpg`),
            type: inferContentType(uri),
        } as any);

        const response = await fetch(IMGBB_UPLOAD_URL, {
            method: 'POST',
            body: formData,
        });

        const result = (await response.json()) as ImgBBUploadResponse;

        if (!response.ok || !result.success || !result.data?.url) {
            throw new Error(result.error?.message || 'ImgBB upload failed');
        }

        return result.data.display_url || result.data.url;
    },
};
