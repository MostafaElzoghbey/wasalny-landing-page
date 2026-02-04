import React from 'react';
import { additionalServices } from '@/data/pricing';
import { Check, Baby, Briefcase, Clock, UserCheck, MapPin } from 'lucide-react';

interface ServiceSelectorProps {
  selectedServices: string[];
  onToggle: (serviceId: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  baby: Baby,
  luggage: Briefcase,
  clock: Clock,
  userCheck: UserCheck,
  mapPin: MapPin,
};

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedServices,
  onToggle,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span className="w-1 h-6 bg-primary rounded-full"></span>
        خدمات إضافية
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {additionalServices.map((service) => {
          const isSelected = selectedServices.includes(service.id);
          const Icon = iconMap[service.icon] || Briefcase;
          
          return (
            <div
              key={service.id}
              onClick={() => onToggle(service.id)}
              className={`
                group cursor-pointer relative p-4 rounded-xl border transition-all duration-300
                ${isSelected 
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md ring-1 ring-primary/50' 
                  : 'border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:text-primary'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {service.nameAr}
                    </h4>
                    <span className="text-sm font-bold text-primary">
                      {service.priceEGP} ج.م
                    </span>
                  </div>
                  
                  {service.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className={`
                  w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                  ${isSelected
                    ? 'bg-primary border-primary text-white'
                    : 'border-gray-300 dark:border-gray-600'
                  }
                `}>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
