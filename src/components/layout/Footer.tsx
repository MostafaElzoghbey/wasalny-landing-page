import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Heart } from 'lucide-react';
import { logoImage } from '@/data/cars';
import { contactInfo } from '@/data/content';
import { viewportConfig } from '@/lib/animations';
import { useBatchReveal } from '@/hooks/useAnimations';

const quickLinks = [
  { label: 'الرئيسية', href: '#home' },
  { label: 'خدماتنا', href: '#services' },
  { label: 'أسطولنا', href: '#fleet' },
  { label: 'مساراتنا', href: '#routes' },
  { label: 'مميزاتنا', href: '#features' },
  { label: 'تواصل معنا', href: '#contact' },
];

const services = [
  'نقل من دمياط للقاهرة',
  'توصيل المطار',
  'رحلات خاصة',
  'سفر جماعي',
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [columnsRef] = useBatchReveal({ selector: '.footer-column', interval: 0.1 });
  const [linksRef] = useBatchReveal({ selector: '.footer-link', interval: 0.05, to: { delay: 0.2 } });

  const handleNavClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="section-container">
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12"
          ref={(el) => { columnsRef.current = el; linksRef.current = el; }}
        >
          {/* Brand Column */}
          <div className="footer-column">
            <div className="flex items-center gap-3 mb-6">
              <img
                src={logoImage}
                alt="وصلني"
                className="w-14 h-14 rounded-xl object-cover"
              />
              <span className="text-2xl font-bold bg-gradient-to-l from-primary-400 to-primary-500 bg-clip-text text-transparent">
                وصلني
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              خدمة نقل الركاب الأولى في دمياط. نوفر لكم رحلات مريحة وآمنة إلى القاهرة والمطار بأسعار مناسبة.
            </p>
            <div className="flex gap-4">
              <motion.a
                href={`https://wa.me/${contactInfo.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-600 hover:bg-green-500 rounded-lg flex items-center justify-center transition-colors footer-link"
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </motion.a>
              <motion.a
                href={`tel:${contactInfo.phone}`}
                className="w-10 h-10 bg-primary-600 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors footer-link"
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.9 }}
              >
                <Phone className="w-5 h-5" />
              </motion.a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h4 className="text-lg font-bold mb-6">روابط سريعة</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <motion.button
                    onClick={() => handleNavClick(link.href)}
                    className="text-gray-400 hover:text-primary-400 transition-colors footer-link"
                    whileHover={{ x: -5 }}
                  >
                    {link.label}
                  </motion.button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="footer-column">
            <h4 className="text-lg font-bold mb-6">خدماتنا</h4>
            <ul className="space-y-3">
              {services.map((service, index) => (
                <li key={index}>
                  <span className="text-gray-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-column">
            <h4 className="text-lg font-bold mb-6">تواصل معنا</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">اتصل بنا</p>
                  <a href={`tel:${contactInfo.phone}`} className="text-white hover:text-primary-400 transition-colors footer-link" dir="ltr">
                    {contactInfo.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">البريد الإلكتروني</p>
                  <a href={`mailto:${contactInfo.email}`} className="text-white hover:text-primary-400 transition-colors footer-link">
                    {contactInfo.email}
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">العنوان</p>
                  <p className="text-white">{contactInfo.address}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportConfig}
          >
            <p className="text-gray-500 text-sm">
              © {currentYear} وصلني. جميع الحقوق محفوظة.
            </p>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              صنع بـ <Heart className="w-4 h-4 text-red-500 fill-red-500" /> في دمياط
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
