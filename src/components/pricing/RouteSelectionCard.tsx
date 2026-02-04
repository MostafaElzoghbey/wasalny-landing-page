import { MapPin, Clock } from 'lucide-react';
import { locations, routes, type Route } from '@/data/pricing';
import { CustomSelect } from '../ui/CustomSelect';

interface RouteSelectionProps {
  fromLocation: string;
  setFromLocation: (value: string) => void;
  toLocation: string;
  setToLocation: (value: string) => void;
  availableToLocations: Set<string>;
  currentRoute: Route | null;
}

export const RouteSelectionCard = ({
  fromLocation, setFromLocation,
  toLocation, setToLocation,
  availableToLocations,
  currentRoute
}: RouteSelectionProps) => {
  // Get all unique 'from' locations that act as a start point
  const validFromLocations = new Set(routes.map(r => r.from));

  const fromOptions = locations
    .filter(loc => validFromLocations.has(loc.id))
    .map(loc => ({ id: loc.id, name: loc.nameAr }));

  const toOptions = locations
    .filter(loc => availableToLocations.has(loc.id))
    .map(loc => ({ id: loc.id, name: loc.nameAr }));

  return (
    <div className="pricing-card bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 relative group isolate">
      {/* Background Effects Container - Clipped */}
      <div className="absolute inset-0 overflow-hidden rounded-xl -z-10">
         <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
      </div>
      
      {/* Content - Visible Overflow for Dropdowns */}
      <div className="p-6 relative z-10">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <MapPin className="w-5 h-5" />
          </div>
          مسار الرحلة
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          
          <CustomSelect
            label="من"
            value={fromLocation}
            onChange={setFromLocation}
            options={fromOptions}
            placeholder="اختر مكان الانطلاق"
            icon={<MapPin className="w-4 h-4" />}
            className="z-50" // High z-index to float above everything
          />

          <CustomSelect
            label="إلى"
            value={toLocation}
            onChange={setToLocation}
            options={toOptions}
            placeholder="اختر الوجهة"
            disabled={!fromLocation}
            icon={<MapPin className="w-4 h-4" />}
            className="z-40" 
          />

        </div>

        {currentRoute && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl flex flex-wrap gap-6 text-sm animate-in fade-in slide-in-from-top-2">
            <span className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
              <div className="p-1 bg-white dark:bg-blue-900/50 rounded-full">
                 <MapPin className="w-4 h-4" />
              </div>
              المسافة: <span className="font-bold">{currentRoute.distanceKm} كم</span>
            </span>
            <span className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
              <div className="p-1 bg-white dark:bg-blue-900/50 rounded-full">
                 <Clock className="w-4 h-4" />
              </div>
              المدة التقريبية: <span className="font-bold">{Math.floor(currentRoute.durationMinutes / 60)} ساعة {currentRoute.durationMinutes % 60 > 0 && `و ${currentRoute.durationMinutes % 60} دقيقة`}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
