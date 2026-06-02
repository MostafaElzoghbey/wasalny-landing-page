export const services = [
  {
    id: 'damietta-cairo',
    title: 'دمياط - القاهرة',
    description: 'رحلات يومية مريحة من دمياط إلى القاهرة والعكس',
    icon: 'route',
  },
  {
    id: 'airport-transfer',
    title: 'توصيل المطار',
    description: 'خدمة توصيل من وإلى مطار القاهرة الدولي',
    icon: 'plane',
  },
  {
    id: 'damietta-alexandria',
    title: 'دمياط - اسكندرية',
    description: 'رحلات مريحة وآمنة من دمياط إلى الإسكندرية والعكس',
    icon: 'car',
  },
  {
    id: 'internal-routes',
    title: 'رحلات داخلية',
    description: 'رحلات سريعة ومريحة داخل دمياط ومدنها',
    icon: 'route',
  },
];

export const features = [
  {
    id: 'safety',
    title: 'أمان تام',
    description: 'سائقين محترفين ومرخصين مع خبرة طويلة',
    icon: 'shield',
  },
  {
    id: 'comfort',
    title: 'راحة فائقة',
    description: 'سيارات حديثة ومكيفة لرحلة مريحة',
    icon: 'star',
  },
  {
    id: 'punctuality',
    title: 'التزام بالمواعيد',
    description: 'نصل في الموعد المحدد دائماً',
    icon: 'clock',
  },
  {
    id: 'pricing',
    title: 'أسعار مناسبة',
    description: 'أفضل الأسعار مع جودة خدمة عالية',
    icon: 'wallet',
  },
  {
    id: 'availability',
    title: 'متاحين 24/7',
    description: 'خدمتنا متاحة على مدار الساعة',
    icon: 'headphones',
  },
  {
    id: 'tracking',
    title: 'تتبع الرحلة',
    description: 'تتبع موقع سيارتك في الوقت الفعلي',
    icon: 'mapPin',
  },
];

export const routes = [
  {
    id: 'damietta-cairo',
    from: 'دمياط',
    to: 'القاهرة',
    duration: '2.5 - 3 ساعات',
    description: 'رحلة مريحة عبر الطريق الساحلي',
  },
  {
    id: 'damietta-airport',
    from: 'دمياط',
    to: 'مطار القاهرة',
    duration: '2.5 - 3 ساعات',
    description: 'توصيل مباشر لمطار القاهرة الدولي',
  },
  {
    id: 'cairo-damietta',
    from: 'القاهرة',
    to: 'دمياط',
    duration: '2.5 - 3 ساعات',
    description: 'عودة مريحة إلى دمياط',
  },
];

export const stats = [
  { id: 'years', value: 5, suffix: '+', label: 'سنوات خبرة' },
  { id: 'drivers', value: 50, suffix: '+', label: 'سائق محترف' },
  { id: 'customers', value: 3000, suffix: '+', label: 'عميل سعيد' },
  { id: 'trips', value: 5000, suffix: '+', label: 'رحلة ناجحة' },
];

export const contactInfo = {
  phone: '01005656117',
  whatsapp: '201005656117',
  email: 'info@wasalny.eg',
  address: 'قهوة حكاوي، شارع وزير، قسم دمياط',
  facebook: 'https://www.facebook.com/damitta.wasalny/?locale=ar_AR',
};

export const sectionCopy = {
  hero: {
    badge: 'دمياط - القاهرة - المطار',
    title: {
      line1: 'خدمة نقل',
      highlight1: 'الركاب',
      line2: 'الأولى في',
      highlight2: 'دمياط'
    },
    description: 'رحلات مريحة وآمنة من دمياط إلى القاهرة والمطار. سيارات حديثة وسائقين محترفين في خدمتك على مدار الساعة.',
    get stats() {
      return [
        { value: '24/7', label: 'خدمة متاحة' },
        { value: `${stats.find(s => s.id === 'customers')?.value}+`, label: stats.find(s => s.id === 'customers')?.label || '' },
        { value: `${stats.find(s => s.id === 'trips')?.value}+`, label: stats.find(s => s.id === 'trips')?.label || '' },
      ];
    }
  },
  services: {
    title: 'خدماتنا',
    subtitle: 'نقدم لكم أفضل خدمات النقل والتوصيل في دمياط والقاهرة',
  },
  fleet: {
    title: 'أسطولنا المميز',
    subtitle: 'نجمع بين الفخامة والراحة في كل رحلة',
  },
  appShowcase: {
    title: 'هوية وصلني',
    subtitle: 'علامتنا التجارية وهويتنا البصرية التي تعكس احترافية خدماتنا',
  },
  routes: {
    title: 'مساراتنا',
    subtitle: 'نغطي المسارات الرئيسية بين دمياط والقاهرة والمطار',
  },
  pricing: {
    title: 'احسب سعر رحلتك',
    subtitle: 'خطط ميزانيتك بدقة واحصل على أفضل سعر لرحلتك مع وصلني',
  },
  features: {
    title: 'لماذا وصلني؟',
    subtitle: 'مميزات تجعلنا الاختيار الأول لنقل الركاب في دمياط',
  },
  faq: {
    title: 'الأسئلة الشائعة',
    subtitle: 'إجابات على أكثر الأسئلة شيوعاً حول خدماتنا',
  },
  cta: {
    title: 'احجز رحلتك الآن',
    subtitle: 'تواصل معنا الآن واحجز رحلتك بسهولة. نحن في خدمتك على مدار الساعة.',
    get trustBadge() {
      const customers = stats.find(s => s.id === 'customers')?.value || 3000;
      const trips = stats.find(s => s.id === 'trips')?.value || 5000;
      return `✨ أكثر من ${customers}+ عميل سعيد • ${trips} رحلة ناجحة • خدمة موثوقة منذ 2020`;
    }
  },
  map: {
    title: 'موقعنا',
    subtitle: 'موقعنا في دمياط ويوجد لدينا توصيل لجميع أنحاء دمياط و سفر خارج دمياط',
  }
};
