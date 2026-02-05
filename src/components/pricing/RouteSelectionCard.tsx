import { MapPin } from 'lucide-react';
import { type Location, type RouteType } from '@/data/pricing';
import { CustomSelect } from '../ui/CustomSelect';

interface RouteSelectionProps {
  routeType: RouteType;
  fromLocation: string;
  setFromLocation: (value: string) => void;
  toLocation: string;
  setToLocation: (value: string) => void;
  availableFromLocations: Location[];
  availableToLocations: Location[];
}

export const RouteSelectionCard = ({
  routeType,
  fromLocation, setFromLocation,
  toLocation, setToLocation,
  availableFromLocations,
  availableToLocations,
}: RouteSelectionProps) => {
  const fromOptions = availableFromLocations.map(loc => ({ id: loc.id, name: loc.nameAr }));
  const toOptions = availableToLocations.map(loc => ({ id: loc.id, name: loc.nameAr }));

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
      </div>
    </div>
  );
};
