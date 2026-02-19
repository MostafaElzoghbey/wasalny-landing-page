import { useEffect } from 'react';
import { Link } from 'react-router-dom';

interface NotFoundProps {
    title?: string;
    message?: string;
    showHomeLink?: boolean;
}

export function NotFound({
    title = "الصفحة غير موجودة - وصلني",
    message = "عذراً، الصفحة التي تبحث عنها غير موجودة.",
    showHomeLink = true
}: NotFoundProps) {
    useEffect(() => {
        document.title = title;

        let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
        const created = !meta;
        const previousContent = meta?.content;

        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'robots';
            document.head.appendChild(meta);
        }
        meta.content = 'noindex';

        return () => {
            if (!meta) return;
            if (created) {
                meta.remove();
            } else if (previousContent !== undefined) {
                meta.content = previousContent;
            }
        };
    }, [title]);

    return (
        <div className="min-h-screen flex items-center justify-center flex-col bg-[hsl(var(--section-alt))] p-4 text-center">
            <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">{message}</p>
            {showHomeLink && (
                <Link to="/" className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-500 transition-colors">
                    العودة للرئيسية
                </Link>
            )}
        </div>
    );
}
