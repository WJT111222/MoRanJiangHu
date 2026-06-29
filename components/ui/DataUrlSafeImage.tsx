import React from 'react';
import { base64图片DataUrl转Blob, 需要转为ObjectUrl展示 } from '../../utils/dataUrlImage';
import { 创建并记录ObjectURL, 释放并记录ObjectURL } from '../../utils/objectUrlLifecycle';

type DataUrlSafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
    sourceLabel?: string;
};

const DataUrlSafeImage: React.FC<DataUrlSafeImageProps> = ({ src, sourceLabel = 'image-preview', ...props }) => {
    const [displaySrc, setDisplaySrc] = React.useState(src);

    React.useEffect(() => {
        if (!需要转为ObjectUrl展示(src)) {
            setDisplaySrc(src);
            return;
        }

        let objectUrl = '';
        try {
            const blob = base64图片DataUrl转Blob(src);
            objectUrl = 创建并记录ObjectURL(blob, {
                source: sourceLabel,
                kind: 'base64-image-preview',
                detail: { 原始字符数: src.length }
            });
            setDisplaySrc(objectUrl);
        } catch (error) {
            console.warn('[图片预览] base64 图片转 Blob URL 失败，回退原始地址', error);
            setDisplaySrc(src);
        }

        return () => {
            释放并记录ObjectURL(objectUrl, {
                source: sourceLabel,
                kind: 'base64-image-preview'
            });
        };
    }, [src, sourceLabel]);

    return <img {...props} src={displaySrc} />;
};

export default DataUrlSafeImage;
