import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Snowflake, Wifi, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { carImages, carCategories } from '@/data/cars';
import { cn } from '@/lib/utils';
import { staggerContainer, fadeInUp, viewportConfig, tabContent } from '@/lib/animations';

type CarCategory = 'sedan' | 'suv' | 'family_cruiser' | 'minibus';

const categoryInfo: Record<CarCategory, { name: string; passengers: number; features: string[] }> = {
  sedan: {
    name: 'تويوتا كورولا',
    passengers: 4,
    features: ['تكييف', 'مقاعد مريحة', 'شاحن USB'],
  },
  suv: {
    name: 'سوزوكي فيتارا',
    passengers: 5,
    features: ['تكييف', 'مساحة أمتعة', 'نظام ترفيه'],
  },
  family_cruiser: {
    name: 'ميتسوبيشي إكسباندر',
    passengers: 7,
    features: ['7 مقاعد', 'تكييف خلفي', 'مساحة واسعة'],
  },
  minibus: {
    name: 'تويوتا هاي إيس',
    passengers: 14,
    features: ['14 راكب', 'تكييف مركزي', 'راحة فائقة'],
  },
};

export function FleetSection() {
  const [activeCategory, setActiveCategory] = useState<CarCategory>('sedan');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = carImages[activeCategory];
  const info = categoryInfo[activeCategory];

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setSelectedImage(images[index]);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const newIndex = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  const prevImage = () => {
    const newIndex = (currentImageIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  return (
    <section id="fleet" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-50/50 to-transparent dark:via-primary-950/20" />
      
      <div className="section-container relative z-10">
        <SectionHeading
          title="أسطولنا"
          subtitle="سيارات حديثة ومريحة تناسب جميع احتياجاتك"
        />

        {/* Category Tabs */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {carCategories.map((category) => (
            <motion.button
              key={category.id}
              variants={fadeInUp}
              onClick={() => setActiveCategory(category.id as CarCategory)}
              className={cn(
                'px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2',
                activeCategory === category.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white dark:bg-gray-800 text-[hsl(var(--foreground))] hover:bg-primary-50 dark:hover:bg-primary-900/20 shadow-md'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-xl">{category.icon}</span>
              <span>{category.nameAr}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Car Info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            variants={tabContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mb-8"
          >
            <div className="flex flex-wrap justify-center items-center gap-6 text-center">
              <motion.div
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md"
                whileHover={{ scale: 1.05 }}
              >
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">{info.name}</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md"
                whileHover={{ scale: 1.05 }}
              >
                <Users className="w-5 h-5 text-primary-500" />
                <span className="font-semibold">{info.passengers} ركاب</span>
              </motion.div>
              {info.features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md"
                  whileHover={{ scale: 1.05 }}
                >
                  {index === 0 ? (
                    <Snowflake className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Wifi className="w-5 h-5 text-green-500" />
                  )}
                  <span>{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Image Gallery */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {images.map((image, index) => (
              <motion.div
                key={image}
                variants={fadeInUp}
                custom={index}
                className="group cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <motion.div
                  className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-gray-100 dark:bg-gray-800"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={image}
                    alt={`سيارة ${info.name}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Hover Overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4"
                  >
                    <span className="text-white font-medium">
                      اضغط للتكبير
                    </span>
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <motion.button
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={closeLightbox}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-8 h-8" />
            </motion.button>

            {/* Navigation Buttons */}
            <motion.button
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-8 h-8" />
            </motion.button>

            <motion.button
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-8 h-8" />
            </motion.button>

            {/* Image */}
            <motion.img
              key={selectedImage}
              src={selectedImage}
              alt="صورة السيارة"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Image Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full text-white font-medium">
              {currentImageIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
