import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  HiShieldCheck,
  HiOutlineClock,
  HiOutlineExclamation,
  HiArrowLeft,
  HiCheck,
  HiSparkles,
} from 'react-icons/hi';
import SafeMap from '../components/SafeMap';
import { createJourney } from '../services/api';
import toast from 'react-hot-toast';

export default function RouteResults() {
  const location = useLocation();
  const navigate = useNavigate();

  const query = location.state || {
    origin: 'Connaught Place Central',
    destination: 'Greenwood Heights Apt 4B',
    originCoords: [28.6289, 77.2090],
    destCoords: [28.6419, 77.2280],
    mode: 'walk',
    isNight: false,
    safetyPriority: 'safest',
  };

  const originLat = query.originCoords?.[0] || 28.6289;
  const originLng = query.originCoords?.[1] || 77.2090;
  const destLat = query.destCoords?.[0] || 28.6419;
  const destLng = query.destCoords?.[1] || 77.2280;

  // Generate realistic route path coordinates connecting origin and destination
  const midLat = (originLat + destLat) / 2;
  const midLng = (originLng + destLng) / 2;

  const routes = [
    {
      id: 'r1',
      name: 'Safest Route — Main Boulevard & Metro Corridor',
      badge: 'RECOMMENDED',
      safetyType: 'safest',
      safetyScore: 94,
      riskLevel: 'LOW RISK',
      distance: '3.4 km',
      distanceKm: 3.4,
      duration: '22 mins',
      durationMins: 22,
      lighting: '98% Well Lit',
      cctv: 'Continuous CCTV Surveillance',
      policePresence: '2 Police Booths on Route',
      crowd: 'High / Active Foot Traffic',
      description: 'Follows arterial roads with active shops, high illumination, and frequent police patrols.',
      path: [
        [originLat, originLng],
        [originLat + 0.003, originLng + 0.002],
        [midLat + 0.002, midLng - 0.001],
        [midLat + 0.006, midLng + 0.005],
        [destLat - 0.002, destLng - 0.001],
        [destLat, destLng],
      ],
    },
    {
      id: 'r2',
      name: 'Fastest Direct Route — Residential Cut-through',
      badge: 'SHORTEST DISTANCE',
      safetyType: 'caution',
      safetyScore: 71,
      riskLevel: 'MEDIUM RISK',
      distance: '2.6 km',
      distanceKm: 2.6,
      duration: '16 mins',
      durationMins: 16,
      lighting: '62% Dimly Lit in Sections',
      cctv: 'Limited Private CCTV Only',
      policePresence: '0 Regular Patrol Points',
      crowd: 'Low / Isolated after 8 PM',
      description: 'Saves 6 minutes by navigating unmonitored residential alleyways and vacant stretches.',
      path: [
        [originLat, originLng],
        [originLat + 0.005, originLng + 0.006],
        [midLat - 0.002, midLng + 0.004],
        [destLat, destLng],
      ],
    },
    {
      id: 'r3',
      name: 'Transit Route — Guarded Metro Station Link',
      badge: 'HIGH SECURITY',
      safetyType: 'moderate',
      safetyScore: 90,
      riskLevel: 'LOW RISK',
      distance: '3.8 km',
      distanceKm: 3.8,
      duration: '19 mins',
      durationMins: 19,
      lighting: '95% Commercial Lighting',
      cctv: 'Full Station CCTV Coverage',
      policePresence: 'Metro Security Staff On Duty',
      crowd: 'Moderate Transit Commuters',
      description: 'Walks via central metro concourse with security checkpoints and emergency call boxes.',
      path: [
        [originLat, originLng],
        [originLat - 0.002, originLng + 0.004],
        [midLat, midLng + 0.008],
        [destLat - 0.001, destLng + 0.003],
        [destLat, destLng],
      ],
    },
  ];

  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [starting, setStarting] = useState(false);

  const activeRoute = routes[selectedRouteIdx];

  const handleStartJourney = async () => {
    setStarting(true);
    try {
      const journey = await createJourney({
        origin: query.origin,
        destination: query.destination,
        originCoords: [originLat, originLng],
        destCoords: [destLat, destLng],
        mode: query.mode,
        routeTitle: activeRoute.name,
        safetyScore: activeRoute.safetyScore,
        distanceKm: activeRoute.distanceKm,
        durationMins: activeRoute.durationMins,
      });

      toast.success('Safe journey started! Real-time tracking enabled.');
      navigate(`/journey/${journey.id}`);
    } catch {
      toast.error('Could not start journey');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border border-white/10">
        <div>
          <Link
            to="/plan"
            className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 font-medium mb-2 no-underline"
          >
            <HiArrowLeft className="w-4 h-4" /> Edit Journey Parameters
          </Link>
          <h1 className="text-2xl font-bold text-white">Route Safety Assessment</h1>
          <p className="text-surface-200 text-sm">
            From <span className="text-white font-medium">{query.origin}</span> to{' '}
            <span className="text-white font-medium">{query.destination}</span>
          </p>
        </div>

        <button
          onClick={handleStartJourney}
          disabled={starting}
          className="btn-primary py-3 px-6 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 cursor-pointer"
        >
          <HiCheck className="w-5 h-5" />
          {starting ? 'Starting Journey...' : 'Start Active Journey'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Route Cards */}
        <div className="lg:col-span-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-surface-200 px-1">
            Available Routes ({routes.length})
          </div>

          {routes.map((r, idx) => {
            const isSelected = idx === selectedRouteIdx;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRouteIdx(idx)}
                className={`glass-card p-5 border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-primary-500 ring-2 ring-primary-500/40 bg-primary-950/20 shadow-xl'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        r.safetyType === 'safest'
                          ? 'bg-emerald-400'
                          : r.safetyType === 'caution'
                          ? 'bg-danger-400'
                          : 'bg-amber-400'
                      }`}
                    />
                    <h2 className="font-bold text-white text-sm md:text-base leading-snug">
                      {r.name}
                    </h2>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap ${
                      r.safetyScore >= 90 ? 'risk-low' : 'risk-medium'
                    }`}
                  >
                    Safety {r.safetyScore}/100
                  </span>
                </div>

                <p className="text-xs text-surface-200 mb-3">{r.description}</p>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
                  <div className="bg-surface-800/60 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-surface-200/70 block">Distance</span>
                    <span className="font-semibold text-white">{r.distance}</span>
                  </div>
                  <div className="bg-surface-800/60 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-surface-200/70 block">Time</span>
                    <span className="font-semibold text-white">{r.duration}</span>
                  </div>
                  <div className="bg-surface-800/60 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-surface-200/70 block">Lighting</span>
                    <span className="font-semibold text-emerald-400">{r.lighting.split(' ')[0]}</span>
                  </div>
                  <div className="bg-surface-800/60 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-surface-200/70 block">Risk</span>
                    <span className={`font-semibold ${r.safetyScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {r.riskLevel.split(' ')[0]}
                    </span>
                  </div>
                </div>

                {/* Safety Breakdown bullets */}
                <div className="text-[11px] text-surface-200/80 space-y-1 border-t border-white/5 pt-2">
                  <div className="flex items-center gap-1.5">
                    <HiShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{r.cctv}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HiShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{r.policePresence}</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-2 text-right">
                    <span className="text-xs font-semibold text-primary-400 flex items-center justify-end gap-1">
                      <HiSparkles className="w-3.5 h-3.5" /> Selected Route
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Interactive Map & Live Details */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-card p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-400"></span>
                Route Map: {activeRoute.name.split('—')[0]}
              </div>
              <span className="text-xs text-emerald-400 font-semibold">
                Score: {activeRoute.safetyScore}/100
              </span>
            </div>

            <SafeMap
              origin={[originLat, originLng]}
              destination={[destLat, destLng]}
              routes={routes}
              selectedRouteIndex={selectedRouteIdx}
              showSafeHavens={true}
              height="480px"
            />
          </div>

          <div className="p-4 rounded-xl glass-card border border-primary-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-white">Ready to begin this journey?</div>
              <div className="text-xs text-surface-200">
                Live location sharing and automatic check-ins will activate immediately.
              </div>
            </div>
            <button
              onClick={handleStartJourney}
              disabled={starting}
              className="btn-primary py-2.5 px-5 text-sm whitespace-nowrap cursor-pointer"
            >
              Start Journey Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
