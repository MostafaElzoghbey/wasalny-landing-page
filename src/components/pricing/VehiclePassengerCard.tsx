import { Car, AlertCircle, Users, CheckCircle2 } from 'lucide-react';
import { vehiclePricing } from '@/data/pricing';
import { cars } from '@/data/cars';

interface VehiclePassengerProps {
  vehicleCategory: string;
  setVehicleCategory: (val: any) => void;
  passengerCount: number;
  setPassengerCount: (val: number) => void;
}

export const VehiclePassengerCard = ({
  vehicleCategory, setVehicleCategory,
  passengerCount, setPassengerCount
}: VehiclePassengerProps) => {
  const selectedVehicle = vehiclePricing.find((v) => v.category === vehicleCategory);
  
  // Helper to get image for category
  const getCarImage = (cat: string) => {
    const car = cars.find(c => c.category === cat);
    return car?.images[0] || null;
  };



  return (
    <div className="pricing-card bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden group">
       <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />

      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 relative z-10">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
           <Car className="w-5 h-5" />
        </div>
        السيارة والركاب
      </h3>

      <div className="space-y-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {vehiclePricing.map((v) => {
            const isActive = vehicleCategory === v.category;
            const image = getCarImage(v.category);
            
            return (
              <div
                key={v.category}
                onClick={() => setVehicleCategory(v.category)}
                className={`
                  cursor-pointer rounded-xl border transition-all duration-300 relative overflow-hidden group/card
                  ${isActive
                    ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-lg shadow-primary/10 scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 z-20 text-primary">
                    <CheckCircle2 className="w-5 h-5 fill-white" />
                  </div>
                )}
                
                <div className="aspect-[16/10] bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                   {image ? (
                     <img 
                       src={image} 
                       alt={v.categoryAr} 
                       className={`w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110 ${!isActive && 'grayscale opacity-80 group-hover/card:grayscale-0 group-hover/card:opacity-100'}`}
                     />
                   ) : (
                     <Car className="w-10 h-10 text-gray-400" />
                   )}
                   {/* Gradient overlay */}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                   
                   <p className="absolute bottom-2 right-2 text-white font-medium text-sm drop-shadow-md">
                     {v.categoryAr}
                   </p>
                </div>
                
                <div className="p-3 text-center">
                   <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" />
                      حتى {v.maxPassengers} ركاب
                   </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
               <Users className="w-4 h-4 text-gray-400" />
               عدد الركاب
             </label>
             
             <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                    disabled={passengerCount <= 1}
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    min={1} 
                    max={15}
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                    className="w-12 text-center bg-transparent border-none focus:ring-0 font-semibold text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button 
                    onClick={() => setPassengerCount(passengerCount + 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                    disabled={passengerCount >= 15}
                  >
                    +
                  </button>
                </div>
             </div>
          </div>
          
           {selectedVehicle && passengerCount > selectedVehicle.maxPassengers && (
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                تنبيه: العدد يتجاوز سعة السيارة ({selectedVehicle.maxPassengers})، قد تحتاج لسيارة أكبر أو أكثر من سيارة.
              </p>
            )}

        </div>
      </div>
    </div>
  );
};
