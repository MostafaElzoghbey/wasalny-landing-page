export interface RouteData {
    id: string;
    title: string;
    description: string;
    metaTitle: string;
    metaDescription: string;
    heroImage: string;
    priceStart: string;
    distance: string;
    duration: string;
    features: string[];
    faqs: { question: string; answer: string }[];
}

export const routeData: Record<string, RouteData> = {
    'damietta-cairo': {
        id: 'damietta-cairo',
        title: 'سفر من دمياط إلى القاهرة',
        description: 'سافر براحة وأمان من باب منزلك في دمياط إلى أي مكان في القاهرة. سيارات حديثة وسائقين محترفين لضمان أفضل تجربة سفر.',
        metaTitle: 'توصيل من دمياط للقاهرة | حجز سيارة خاصة بأفضل سعر - وصلني',
        metaDescription: 'احجز سيارة خاصة من دمياط للقاهرة بأفضل الأسعار. سيارات حديثة ومكيفة، سائقين محترفين، وخدمة من الباب للباب. متاحين 24/7.',
        heroImage: '/assets/images/cars/family_cruiser/mitsubishi-xpander-2022-rental-damietta-front-white.jpeg',
        priceStart: '1500',
        distance: '290 كم',
        duration: '3 ساعات',
        features: ['توصيل من الباب للباب', 'سيارات مكيفة وحديثة', 'سائقين ذوي خبرة', 'شحن حقائب مجاني'],
        faqs: [
            {
                question: 'كم سعر التوصيل من دمياط للقاهرة؟',
                answer: 'تبدأ الأسعار من 1500 جنيه للسيارات السيدان، وتختلف حسب نوع السيارة (SUV أو ميكروباص) ومكان التوصيل في القاهرة.'
            },
            {
                question: 'هل الرحلة مباشرة؟',
                answer: 'نعم، الرحلة خاصة ومباشرة من باب منزلك في دمياط إلى وجهتك في القاهرة دون توقف إلا للراحة إذا طلبت ذلك.'
            }
        ]
    },
    'damietta-airport': {
        id: 'damietta-airport',
        title: 'توصيل من دمياط لمطار القاهرة',
        description: 'لا تقلق بشأن موعد طائرتك. نضمن لك الوصول إلى مطار القاهرة في الوقت المحدد بكل راحة وهدوء.',
        metaTitle: 'توصيل مطار القاهرة من دمياط | استقبال وتوديع - وصلني',
        metaDescription: 'خدمة توصيل مطار القاهرة من دمياط. استقبال وتوصيل 24/7. سيارات عائلية وحقائب كبيرة. احجز الآن واضمن وصولك في الموعد.',
        heroImage: '/assets/images/cars/minibus/toyota-hiace-granvia-rental-damietta-front-white.jpeg',
        priceStart: '1600',
        distance: '280 كم',
        duration: '2.5 - 3 ساعات',
        features: ['التزام تام بالمواعيد', 'سيارات واسعة للحقائب', 'انتظار في صالة الوصول', 'متابعة حركة الطيران'],
        faqs: [
            {
                question: 'هل تنتظرون في حال تأخر الطائرة؟',
                answer: 'نعم، نتابع مواعيد وصول الرحلات وننتظر العميل في حالة تأخر الطائرة دون مصاريف إضافية لفترة معقولة.'
            },
            {
                question: 'ما هي السيارات المتاحة للمطار؟',
                answer: 'نوفر سيارات سيدان للعدد القليل، وسيارات عائلية (Mitsubishi Xpander) و ميكروباص (HiAce) للعائلات والحقائب الكثيرة.'
            }
        ]
    },
    'cairo-damietta': {
        id: 'cairo-damietta',
        title: 'توصيل من القاهرة إلى دمياط',
        description: 'عائد إلى دمياط؟ احجز سيارتك من القاهرة أو المطار واستمتع برحلة عودة مريحة وآمنة.',
        metaTitle: 'توصيل من القاهرة لدمياط | رحلات عودة مريحة - وصلني',
        metaDescription: 'تحتاج سيارة من القاهرة لدمياط؟ خدمة توصيل خاصة من أي مكان في القاهرة أو الجيزة إلى باب بيتك في دمياط. احجز الآن.',
        heroImage: '/assets/images/cars/sedan/fiat-tipo-rental-damietta-front-blue-grey.jpeg',
        priceStart: '1500',
        distance: '290 كم',
        duration: '3 ساعات',
        features: ['حجز فوري', 'سائقين محترفين للطرق السريعة', 'راحة تامة بعد السفر', 'أسعار ثابتة'],
        faqs: [
            {
                question: 'كيف يمكنني حجز سيارة من القاهرة؟',
                answer: 'يمكنك الحجز عبر الهاتف أو الواتساب قبل موعد السفر بوقت كافٍ (يفضل 24 ساعة) لضمان توفر السيارة.'
            }
        ]
    }
};
