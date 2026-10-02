import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiLocationMarker,
  HiOutlineClock,
  HiShieldCheck,
  HiArrowRight,
  HiSparkles,
  HiMoon,
  HiSun,
} from 'react-icons/hi';
import SafeMap from '../components/SafeMap';
import toast from 'react-hot-toast';

const PRESET_PLACES = [
  { name: 'Connaught Place Central', coords: [28.6289, 77.2090] },
  { name: 'Greenwood Heights Apt 4B', coords: [28.6419, 77.2280] },
  { name: 'Metro Station Gate 2', coords: [28.6189, 77.2140] },
  { name: 'Tech Park Cyber City', coords: [28.6520, 77.2350] },
  { name: 'City Hospital & Medical Center', coords: [28.6210, 77.2230] },
];

export default function PlanJourney() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('Connaught Place Central');
  const [destination, setDestination] = useState('Greenwood Heights Apt 4B');
  const [originCoords, setOriginCoords] = useState([28.6289, 77.2090]);
  const [destCoords, setDestCoords] = useState([28.6419, 77.2280]);
  const [mode, setMode] = useState('walk'); // 'walk' | 'cab' | 'transit' | 'bike'
  const [isNight, setIsNight] = useState(false);
  const [safetyPriority, setSafetyPriority] = useState('safest');

  const handleUseCurrentLocation = () => {
    toast.success('Using current GPS coordinates');
    setOrigin('My Current Location (Connaught Place)');
    setOriginCoords([28.6289, 77.2090]);
  };

  const handleSelectPreset = (field, place) => {
    if (field === 'origin') {
      setOrigin(place.name);
      setOriginCoords(place.coords);
    } else {
      setDestination(place.name);
      setDestCoords(place.coords);
    }
  };

  const handleSwap = () => {
    const tempName = origin;
    const tempCoords = originCoords;
    setOrigin(destination);
    setOriginCoords(destCoords);
    setDestination(tempName);
    setDestCoords(tempCoords);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      return toast.error('Please specify both origin and destination');
    }

    navigate('/routes', {
      state: {
        origin,
        destination,
        originCoords,
        destCoords,
        mode,
        isNight,
        safetyPriority,
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HiLocationMarker className="w-6 h-6 text-primary-400" />
            <h1 className="text-2xl font-bold text-white">Plan a Safe Journey</h1>
          </div>
          <p className="text-surface-200 text-sm">
            Compare route safety scores calculated from street illumination, CCTV surveillance, and verified safe havens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNight(!isNight)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              isNight
                ? 'bg-purple-900/60 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-900/30'
                : 'bg-surface-800 text-surface-200 border-white/10 hover:bg-surface-700'
            }`}
          >
            {isNight ? (
              <>
                <HiMoon className="w-4 h-4 text-amber-300" /> Night Mode (Extra Safety Check)
              </>
            ) : (
              <>
                <HiSun className="w-4 h-4 text-amber-400" /> Daytime Travel
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 border border-white/10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Origin */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-surface-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Starting Point
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="text-[11px] text-primary-400 hover:text-primary-300 font-medium bg-transparent border-none cursor-pointer"
                  >
                    📍 Use GPS Location
                  </button>
                </div>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter starting location"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  required
                />
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-2">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="p-1.5 rounded-full bg-surface-800 hover:bg-surface-700 border border-white/10 text-surface-200 hover:text-white cursor-pointer transition-transform hover:rotate-180 duration-200"
                  title="Swap Origin and Destination"
                >
                  ⇅
                </button>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs font-semibold text-surface-200 mb-1.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Destination
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter destination location"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[11px] text-surface-200/60 block mb-2">
                  Quick Safe Destinations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_PLACES.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleSelectPreset('dest', p)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-primary-900/40 hover:text-primary-300 border border-white/5 text-surface-200 transition-all cursor-pointer"
                    >
                      {p.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode of Transport */}
              <div>
                <label className="block text-xs font-semibold text-surface-200 mb-2">
                  Mode of Travel
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'walk', label: 'Walking', icon: '🚶‍♀️' },
                    { id: 'cab', label: 'Cab / Auto', icon: '🚖' },
                    { id: 'transit', label: 'Metro / Bus', icon: '🚇' },
                    { id: 'bike', label: 'Two-Wheeler', icon: '🛵' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`p-2.5 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                        mode === m.id
                          ? 'bg-primary-600/30 border-primary-500 text-white shadow-md shadow-primary-500/20'
                          : 'bg-surface-800/60 border-white/5 text-surface-200 hover:bg-surface-700'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-[11px] font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Safety Priority */}
              <div>
                <label className="block text-xs font-semibold text-surface-200 mb-2">
                  Routing Preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSafetyPriority('safest')}
                    className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                      safetyPriority === 'safest'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white'
                        : 'bg-surface-800 border-white/5 text-surface-200 hover:bg-surface-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1 text-emerald-400">
                      <HiShieldCheck className="w-4 h-4" /> Safest Path
                    </div>
                    <div className="text-[10px] text-surface-200/70 mt-0.5">
                      Main illuminated roads & active surveillance
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSafetyPriority('fastest')}
                    className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                      safetyPriority === 'fastest'
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-surface-800 border-white/5 text-surface-200 hover:bg-surface-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1 text-amber-400">
                      <HiOutlineClock className="w-4 h-4" /> Fastest Path
                    </div>
                    <div className="text-[10px] text-surface-200/70 mt-0.5">
                      Shortest duration regardless of alleyways
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 mt-4"
              >
                <HiSparkles className="w-5 h-5 text-amber-300" />
                Find Safe Routes
              </button>
            </form>
          </div>
        </div>

        {/* Map Preview Container */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-xs font-semibold text-surface-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Area Safety Radar & Live Havens
              </div>
              <span className="text-[11px] text-surface-200/60">
                Tap map to inspect safe stops
              </span>
            </div>

            <SafeMap
              origin={originCoords}
              destination={destCoords}
              height="460px"
              showSafeHavens={true}
            />
          </div>

          <div className="p-4 rounded-xl bg-surface-800/60 border border-white/5 flex items-center justify-between text-xs text-surface-200">
            <div className="flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <span>All routes are screened against police records and real-time street lighting indices.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
