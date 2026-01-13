import { motion } from 'framer-motion';
import { Phone, MessageCircle, ChevronDown, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { carImages } from '@/data/cars';
import { contactInfo } from '@/data/content';
import { staggerContainer, fadeInUp, floatAnimation } from '@/lib/animations';

export function HeroSection() {
  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent('مرحباً، أريد حجز رحلة')}`,
      '_blank'
    );
  };

  const handleCall = () => {
    window.open(`tel:${contactInfo.phone}`);
  };

  const scrollToServices = () => {
    document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden pt-20"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-bl from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-900 dark:to-primary-950/30" />
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 bg-primary-200/30 dark:bg-primary-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent-200/30 dark:bg-accent-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-300/20 dark:bg-primary-600/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Content */}
          <motion.div
            className="text-center lg:text-right"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-6"
            >
              <MapPin className="w-4 h-4" />
              <span>دمياط - القاهرة - المطار</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6"
            >
              <span className="text-[hsl(var(--foreground))]">خدمة نقل </span>
              <span className="gradient-text">الركاب</span>
              <br />
              <span className="text-[hsl(var(--foreground))]">الأولى في </span>
              <span className="text-accent-500">دمياط</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] mb-8 max-w-xl mx-auto lg:mx-0 lg:mr-0"
            >
              رحلات مريحة وآمنة من دمياط إلى القاهرة والمطار. سيارات حديثة وسائقين محترفين في خدمتك على مدار الساعة.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                variant="accent"
                size="lg"
                icon={MessageCircle}
                onClick={handleWhatsApp}
              >
                احجز عبر واتساب
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={Phone}
                onClick={handleCall}
              >
                اتصل الآن
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              className="mt-12 grid grid-cols-3 gap-6"
            >
              {[
                { value: '5000+', label: 'رحلة ناجحة' },
                { value: '3000+', label: 'عميل سعيد' },
                { value: '24/7', label: 'خدمة متاحة' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center lg:text-right"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <div className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {stat.value}
                  </div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Main Car Image */}
            <motion.div
              className="relative z-10"
              variants={floatAnimation}
              animate="animate"
            >
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-500/20 to-transparent rounded-3xl blur-2xl transform scale-95" />
                
                {/* Car Image */}
                <motion.img
                  src={carImages.family_cruiser[0]}
                  alt="سيارة وصلني"
                  className="w-full h-auto rounded-3xl shadow-2xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Floating Badge */}
                <motion.div
                  className="absolute -bottom-4 -right-4 sm:bottom-6 sm:right-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        احجز الآن
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        رد فوري
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Price Badge */}
                <motion.div
                  className="absolute -top-4 -left-4 sm:top-6 sm:left-6 bg-accent-500 text-white rounded-2xl shadow-xl px-4 py-3"
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 1.2 }}
                  whileHover={{ scale: 1.05, rotate: 3 }}
                >
                  <p className="text-xs font-medium opacity-90">أسعار تبدأ من</p>
                  <p className="text-xl font-bold">أفضل الأسعار</p>
                </motion.div>
              </div>
            </motion.div>

            {/* Background Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
              <motion.div
                className="absolute top-0 right-0 w-32 h-32 border-2 border-primary-200 dark:border-primary-800 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute bottom-0 left-0 w-24 h-24 border-2 border-accent-200 dark:border-accent-800 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary-600 dark:text-primary-400"
        onClick={scrollToServices}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <ChevronDown className="w-8 h-8" />
      </motion.button>
    </section>
  );
}
