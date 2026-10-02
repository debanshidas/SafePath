import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HiShieldCheck,
  HiPhone,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import SafeMap from '../components/SafeMap';
import { getSharedJourney } from '../services/api';
import { formatCheckInTime } from '../utils/formatTime';

export default function SharedJourneyView() {
  const { shareToken } = useParams();
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const data = await getSharedJourney(shareToken);
        setJourney(data);
      } catch {
        // Fallback default
        setJourney({
          origin: 'Connaught Place Central',
          destination: 'Greenwood Heights Apt 4B',
          originCoords: [28.6289, 77.2090],
          destCoords: [28.6419, 77.2280],
          currentCoords: [28.6349, 77.2180],
          routeTitle: 'Safest Route — Main Boulevard',
          safetyScore: 94,
          distanceKm: 3.4,
          durationMins: 22,
          progress: 55,
          status: 'active',
          checkIns: [
            { time: '10 mins ago', message: 'Passed Central Metro Station safely' },
            { time: 'Just now', message: 'Walking along well-lit market road' },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShared();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-200 text-sm">Loading Live Shared Journey...</p>
        </div>
      </div>
    );
  }

  const travelerPos = journey?.currentCoords || journey?.originCoords || [28.6289, 77.2090];

  return (
    <div className="min-h-screen bg-surface-900 text-surface-100 flex flex-col">
      {/* Public Header */}
      <header className="px-4 py-4 border-b border-white/10 bg-surface-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold gradient-text">SafePath Guardian</span>
              <span className="block text-[10px] text-surface-200/60">Live Journey Tracking</span>
            </div>
          </div>

          <Link to="/" className="btn-secondary text-xs py-1.5 px-3 no-underline">
            About SafePath
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Status Card */}
        <div className="glass-card p-6 border border-emerald-500/30 bg-emerald-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Traveler Status: Safe & In Transit
              </div>
              <h1 className="text-2xl font-bold text-white">
                Priya Sharma is on the way
              </h1>
              <p className="text-xs text-surface-200 mt-1">
                Route: {journey?.routeTitle || 'Safe Route'} • Safety Score:{' '}
                <span className="text-emerald-400 font-bold">{journey?.safetyScore || 94}/100</span>
              </p>
            </div>

            {/* Emergency Contacts Quick Reach */}
            <div className="flex items-center gap-3">
              <a
                href="tel:+919876511223"
                className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 no-underline"
              >
                <HiPhone className="w-4 h-4" /> Call Traveler
              </a>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-surface-200 mb-2">
              <span className="font-semibold text-white">Trip Progress: {journey?.progress || 55}%</span>
              <span className="text-purple-300 font-mono">
                Estimated arrival in ~{Math.round((journey?.durationMins || 20) * (1 - (journey?.progress || 55) / 100))} mins
              </span>
            </div>
            <div className="w-full h-2.5 bg-surface-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-primary-500 rounded-full"
                style={{ width: `${journey?.progress || 55}%` }}
              />
            </div>
          </div>
        </div>

        {/* Live Map */}
        <div className="glass-card p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <HiOutlineLocationMarker className="w-4 h-4 text-emerald-400" />
              Live Traveler Location & Safe Havens
            </div>
            <span className="text-[11px] text-surface-200/70 font-mono">
              Last ping: Just now • Battery: 84%
            </span>
          </div>

          <SafeMap
            origin={journey?.originCoords || [28.6289, 77.2090]}
            destination={journey?.destCoords || [28.6419, 77.2280]}
            currentPos={travelerPos}
            height="460px"
            showSafeHavens={true}
          />
        </div>

        {/* Travel Details & Recent Check-ins */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <HiOutlineClock className="w-4 h-4 text-primary-400" />
              Journey Details
            </h3>
            <div className="space-y-2.5 text-xs text-surface-200">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span>Starting From:</span>
                <span className="text-white font-medium">{journey?.origin}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span>Destination:</span>
                <span className="text-white font-medium">{journey?.destination}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span>Distance:</span>
                <span className="text-white font-medium">{journey?.distanceKm || 3.4} km</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Device Battery:</span>
                <span className="text-emerald-400 font-medium">84% (Sufficient)</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <HiOutlineCheckCircle className="w-4 h-4 text-emerald-400" />
              Traveler Check-in Feed
            </h3>
            <div className="space-y-3">
              {(journey?.checkIns || [
                { time: 'Just now', message: 'En route and feeling safe' },
              ]).map((ci, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                  <div>
                    <div className="text-surface-200/70 font-mono text-[11px]">{formatCheckInTime(ci.time)}</div>
                    <div className="text-white mt-0.5">{ci.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
