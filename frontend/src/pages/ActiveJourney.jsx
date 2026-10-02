import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  HiShieldCheck,
  HiOutlineShare,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiCheck,
  HiOutlineLightningBolt,
  HiVolumeUp,
} from 'react-icons/hi';
import SafeMap from '../components/SafeMap';
import SOSModal from '../components/SOSModal';
import FakeCallModal from '../components/FakeCallModal';
import {
  getStoredActiveJourney,
  updateJourneyProgress,
  finishJourney,
  cancelActiveJourney,
} from '../services/mockStorage';
import { endJourney, cancelJourney, postLocation } from '../services/api';
import { playSuccessChime } from '../utils/soundEffects';
import { formatCheckInTime } from '../utils/formatTime';
import toast from 'react-hot-toast';

export default function ActiveJourney() {
  const { journeyId } = useParams();
  const navigate = useNavigate();

  const [journey, setJourney] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentCoords, setCurrentCoords] = useState([28.6289, 77.2090]);
  const [etaMins, setEtaMins] = useState(18);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [fakeCallOpen, setFakeCallOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize journey
  useEffect(() => {
    let active = getStoredActiveJourney();
    if (!active) {
      // Fallback create mock active journey if navigated directly
      active = {
        id: journeyId || 'j_' + Date.now(),
        shareToken: 'safe_demo_track',
        origin: 'Connaught Place Central',
        destination: 'Greenwood Heights Apt 4B',
        originCoords: [28.6289, 77.2090],
        destCoords: [28.6419, 77.2280],
        mode: 'walk',
        routeTitle: 'Safest Route — Main Boulevard & Metro Corridor',
        safetyScore: 94,
        distanceKm: 3.4,
        durationMins: 22,
        progress: 15,
        startTime: new Date().toISOString(),
        currentCoords: [28.6289, 77.2090],
        checkIns: [
          { time: 'Just now', message: 'Journey started with live safety tracking' },
        ],
      };
    }
    setJourney(active);
    setProgress(active.progress || 15);
    setCurrentCoords(active.currentCoords || active.originCoords);
    setEtaMins(Math.max(2, Math.round(active.durationMins * (1 - (active.progress || 15) / 100))));
  }, [journeyId]);

  // Simulation timer: progress gently advances along the route every 4 seconds
  useEffect(() => {
    if (!journey) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        const next = Math.min(100, prev + 3);

        // Interpolate coordinates between origin and destination
        const startLat = journey.originCoords[0];
        const startLng = journey.originCoords[1];
        const endLat = journey.destCoords[0];
        const endLng = journey.destCoords[1];

        const ratio = next / 100;
        const newLat = startLat + (endLat - startLat) * ratio;
        const newLng = startLng + (endLng - startLng) * ratio;

        const newPos = [newLat, newLng];
        setCurrentCoords(newPos);
        updateJourneyProgress(next, newPos);
        setEtaMins(Math.max(1, Math.round(journey.durationMins * (1 - next / 100))));

        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [journey]);

  const handleCheckIn = () => {
    playSuccessChime();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = updateJourneyProgress(progress, currentCoords, `Checked in safely at ${timeStr}`);
    if (updated) setJourney({ ...updated });
    // Best-effort sync; the offline store above is the source of truth for the UI.
    if (journey?.id) {
      postLocation(journey.id, {
        lat: currentCoords[0],
        lng: currentCoords[1],
        progress,
        message: `Checked in safely at ${timeStr}`,
      });
    }
    toast.success('Safe check-in recorded & broadcasted to emergency contacts!');
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/share/${journey?.shareToken || 'safe_demo'}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Live Tracking Link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleEndJourney = () => {
    if (journey?.id) endJourney(journey.id);
    finishJourney();
    playSuccessChime();
    toast.success('🎉 You have arrived safely! Contacts have been notified.');
    navigate('/dashboard');
  };

  const handleCancelJourney = () => {
    if (window.confirm('Are you sure you want to end this journey early?')) {
      if (journey?.id) cancelJourney(journey.id);
      cancelActiveJourney();
      toast.success('Journey ended');
      navigate('/dashboard');
    }
  };

  if (!journey) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-surface-200">Loading active journey tracking...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Status Header */}
      <div className="glass-card p-6 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-950/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Live SafePath Journey Active
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {journey.origin} ➔ {journey.destination}
          </h1>
          <p className="text-xs text-surface-200 mt-1">
            Route: {journey.routeTitle} • Safety Score:{' '}
            <span className="text-emerald-400 font-semibold">{journey.safetyScore}/100</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleShareLink}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
            title="Share live link with friends or family"
          >
            <HiOutlineShare className="w-4 h-4 text-primary-400" />
            {copied ? 'Link Copied!' : 'Share Live Tracker'}
          </button>

          <button
            onClick={() => setFakeCallOpen(true)}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
            title="Trigger a discreet fake call if you feel uncomfortable"
          >
            <HiVolumeUp className="w-4 h-4 text-purple-400" />
            Fake Call
          </button>

          <button
            onClick={() => setSosModalOpen(true)}
            className="btn-danger text-xs py-2 px-4 flex items-center gap-1.5 shadow-lg shadow-danger-500/30 cursor-pointer"
          >
            <HiOutlineExclamationCircle className="w-4 h-4" />
            SOS
          </button>
        </div>
      </div>

      {/* Progress & Live Telemetry Bar */}
      <div className="glass-card p-5 border border-white/10">
        <div className="flex items-center justify-between text-xs text-surface-200 mb-2">
          <span className="font-semibold text-white">Trip Progress: {progress}%</span>
          <span className="text-purple-300 font-mono">
            ETA: ~{etaMins} mins remaining ({((journey.distanceKm * (100 - progress)) / 100).toFixed(1)} km)
          </span>
        </div>

        <div className="w-full h-3 bg-surface-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-primary-500 to-accent-500 transition-all duration-700 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="bg-surface-800/40 p-2.5 rounded-xl border border-white/5">
            <span className="text-surface-200/70 block text-[10px]">Estimated Arrival</span>
            <span className="font-bold text-white text-sm">~{etaMins} mins</span>
          </div>
          <div className="bg-surface-800/40 p-2.5 rounded-xl border border-white/5">
            <span className="text-surface-200/70 block text-[10px]">Device Battery</span>
            <span className="font-bold text-emerald-400 text-sm">84% Optimal</span>
          </div>
          <div className="bg-surface-800/40 p-2.5 rounded-xl border border-white/5">
            <span className="text-surface-200/70 block text-[10px]">Emergency Mode</span>
            <span className="font-bold text-primary-300 text-sm">Standing By</span>
          </div>
          <div className="bg-surface-800/40 p-2.5 rounded-xl border border-white/5">
            <span className="text-surface-200/70 block text-[10px]">Police Havens Nearby</span>
            <span className="font-bold text-white text-sm">3 Accessible</span>
          </div>
        </div>
      </div>

      {/* Map & Check-ins Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Interactive Map */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-card p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                Live GPS Position & Safe Havens
              </span>
              <span className="text-[11px] text-surface-200/60">Auto-updating every 4s</span>
            </div>

            <SafeMap
              origin={journey.originCoords}
              destination={journey.destCoords}
              currentPos={currentCoords}
              routes={[
                {
                  id: 'live_route',
                  name: journey.routeTitle,
                  safetyType: 'safest',
                  safetyScore: journey.safetyScore,
                  distance: `${journey.distanceKm} km`,
                  duration: `${journey.durationMins} mins`,
                  path: [
                    journey.originCoords,
                    [
                      (journey.originCoords[0] + journey.destCoords[0]) / 2 + 0.002,
                      (journey.originCoords[1] + journey.destCoords[1]) / 2 - 0.001,
                    ],
                    journey.destCoords,
                  ],
                },
              ]}
              selectedRouteIndex={0}
              height="480px"
            />
          </div>
        </div>

        {/* Check-ins & End Journey Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Check-in Button */}
          <div className="glass-card p-5 border border-white/10 text-center">
            <h3 className="text-sm font-bold text-white mb-1">Safety Check-In</h3>
            <p className="text-xs text-surface-200 mb-4">
              Tap below to notify your trusted contacts that everything is going smoothly.
            </p>

            <button
              onClick={handleCheckIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer border-none transition-all"
            >
              <HiOutlineCheckCircle className="w-5 h-5" />
              I&apos;m Feeling Safe (Check-in)
            </button>
          </div>

          {/* Activity Log / Check-ins */}
          <div className="glass-card p-5 border border-white/10">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-200 mb-3">
              Journey Timeline
            </h3>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {(journey.checkIns || []).map((ci, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 flex-shrink-0"></span>
                  <div>
                    <div className="text-surface-200 font-mono text-[11px]">{formatCheckInTime(ci.time)}</div>
                    <div className="text-white mt-0.5">{ci.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* End Journey Controls */}
          <div className="glass-card p-5 border border-white/10 space-y-3">
            <button
              onClick={handleEndJourney}
              className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <HiCheck className="w-5 h-5" />
              Arrived Safely & End Trip
            </button>

            <button
              onClick={handleCancelJourney}
              className="w-full text-center text-xs text-surface-200/70 hover:text-danger-400 cursor-pointer bg-transparent border-none py-1"
            >
              Cancel Tracking Early
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SOSModal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} />
      <FakeCallModal isOpen={fakeCallOpen} onClose={() => setFakeCallOpen(false)} />
    </div>
  );
}
