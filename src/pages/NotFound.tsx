import { Link } from 'react-router-dom';

export function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center flex-col bg-gray-50 dark:bg-gray-950 p-4 text-center">
            <title>الصفحة غير موجودة - وصلني</title>
            <meta name="robots" content="noindex" />
            <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
            <Link to="/" className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-500 transition-colors">
                العودة للرئيسية
            </Link>
        </div>
    );
}
