import React from 'react';
import { 读取图片资源 } from '../../services/dbService';
import { base64图片DataUrl转Blob, 解析图片预览源, 需要转为ObjectUrl展示 } from '../../utils/dataUrlImage';
import { 创建并记录ObjectURL, 释放并记录ObjectURL } from '../../utils/objectUrlLifecycle';

type DataUrlSafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
    sourceLabel?: string;
};

const DataUrlSafeImage: React.FC<DataUrlSafeImageProps> = ({ src, sourceLabel = 'image-preview', ...props }) => {
    const [displaySrc, setDisplaySrc] = React.useState(src);

    React.useEffect(() => {
        let cancelled = false;
        let objectUrl = '';

        const resolveSource = async () => {
            const resolvedSrc = await 解析图片预览源(src, 读取图片资源);
            if (cancelled) return;

            if (!需要转为ObjectUrl展示(resolvedSrc)) {
                setDisplaySrc(resolvedSrc);
                return;
            }

            try {
                const blob = base64图片DataUrl转Blob(resolvedSrc);
                objectUrl = 创建并记录ObjectURL(blob, {
                    source: sourceLabel,
                    kind: 'base64-image-preview',
                    detail: { 原始字符数: resolvedSrc.length }
                });
                if (!cancelled) setDisplaySrc(objectUrl);
            } catch (error) {
                console.warn('[图片预览] base64 图片转 Blob URL 失败，回退原始地址', error);
                if (!cancelled) setDisplaySrc(resolvedSrc);
            }
        };

        void resolveSource();

        return () => {
            cancelled = true;
            释放并记录ObjectURL(objectUrl, {
                source: sourceLabel,
                kind: 'base64-image-preview'
            });
        };
    }, [src, sourceLabel]);

    return <img {...props} src={displaySrc} />;
};

export default DataUrlSafeImage;
