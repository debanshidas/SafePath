import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  HiShieldCheck,
  HiLocationMarker,
  HiPhone,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiSparkles,
  HiOutlineExternalLink,
  HiArrowRight,
  HiVolumeUp,
} from 'react-icons/hi';
import { getStoredContacts, getStoredActiveJourney, getStoredJourneys } from '../services/mockStorage';
import SOSModal from '../components/SOSModal';
import FakeCallModal from '../components/FakeCallModal';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [activeJourney, setActiveJourney] = useState(null);
  const [recentJourneys, setRecentJourneys] = useState([]);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [fakeCallOpen, setFakeCallOpen] = useState(false);

  useEffect(() => {
    setContacts(getStoredContacts());
    setActiveJourney(getStoredActiveJourney());
    setRecentJourneys(getStoredJourneys());
  }, []);

  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              SafePath Active Shield ON
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Hello, {user?.displayName || 'Traveler'} 👋
          </h1>
          <p className="text-surface-200 text-sm mt-0.5">
            Your safety monitoring is active. Current zone risk:{' '}
            <span className="text-emerald-400 font-semibold">Low (92/100)</span>
          </p>
        </div>

        {/* Quick Fake Call discreet trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFakeCallOpen(true)}
            className="btn-secondary flex items-center gap-2 text-xs py-2.5 px-4 cursor-pointer"
            title="Simulate an incoming phone call to leave an uncomfortable situation"
          >
            <HiVolumeUp className="w-4 h-4 text-purple-400" />
            <span>Discreet Fake Call</span>
          </button>

          <button
            onClick={() => setSosModalOpen(true)}
            className="btn-danger flex items-center gap-2 text-xs py-2.5 px-4 shadow-lg shadow-danger-500/30 cursor-pointer"
          >
            <HiOutlineExclamationCircle className="w-4 h-4" />
            <span>Instant SOS</span>
          </button>
        </div>
      </div>

      {/* Hero Grid: SOS + Active Journey or Plan Route */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOS Card */}
        <div className="glass-card p-6 border border-danger-500/20 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-danger-500/10 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-lg font-bold text-white mb-1">Emergency SOS</h2>
          <p className="text-surface-200 text-xs max-w-xs mb-6">
            Press and hold to send instant GPS coordinates & distress alert to{' '}
            <span className="text-white font-medium">{primaryContact?.name || 'contacts'}</span>.
          </p>

          <button
            id="dashboard-sos-btn"
            onClick={() => setSosModalOpen(true)}
            className="sos-button flex flex-col items-center justify-center my-2"
          >
            <span>SOS</span>
          </button>

          <div className="text-[11px] text-surface-200/60 mt-4 flex items-center gap-1.5">
            <HiShieldCheck className="w-4 h-4 text-emerald-400" />
            112 & 1091 emergency integration ready
          </div>
        </div>

        {/* Active Journey or Plan Route Card */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between border border-white/10">
          {activeJourney ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ● Journey in Progress
                  </span>
                  <span className="text-xs text-surface-200">
                    Started {new Date(activeJourney.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <Link
                  to={`/journey/${activeJourney.id}`}
                  className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1 no-underline"
                >
                  View Live Map <HiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20"></span>
                  <span className="text-sm font-semibold text-white truncate">{activeJourney.origin}</span>
                </div>
                <div className="ml-1.5 pl-4 border-l-2 border-dashed border-white/20 py-1 text-xs text-surface-200">
                  {activeJourney.distanceKm} km • ~{activeJourney.durationMins} mins • {activeJourney.routeTitle}
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-purple-400 ring-4 ring-purple-400/20"></span>
                  <span className="text-sm font-semibold text-white truncate">{activeJourney.destination}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-surface-200 mb-1.5">
                  <span>Journey Progress</span>
                  <span className="font-mono text-purple-300">{activeJourney.progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-primary-500 to-accent-500 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.max(activeJourney.progress, 15)}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/journey/${activeJourney.id}`)}
                  className="btn-primary flex-1 py-2.5 text-sm"
                >
                  Resume Live Tracking
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <HiLocationMarker className="w-5 h-5 text-primary-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Plan Your Next Safe Journey</h2>
                </div>
                <p className="text-surface-200 text-sm mb-6 leading-relaxed">
                  Compare multiple route alternatives analyzed for street illumination, crowd density, CCTV surveillance, and verified safe stops before you step out.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="glass-card-light p-3 rounded-xl border border-white/5">
                    <div className="text-xs text-surface-200/80">Surveillance</div>
                    <div className="text-sm font-bold text-white mt-0.5">85% CCTV</div>
                  </div>
                  <div className="glass-card-light p-3 rounded-xl border border-white/5">
                    <div className="text-xs text-surface-200/80">Street Lighting</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">High Density</div>
                  </div>
                  <div className="glass-card-light p-3 rounded-xl border border-white/5">
                    <div className="text-xs text-surface-200/80">Safe Havens</div>
                    <div className="text-sm font-bold text-purple-400 mt-0.5">14 Nearby</div>
                  </div>
                </div>
              </div>

              <Link
                to="/plan"
                className="btn-primary text-center py-3 font-semibold text-sm flex items-center justify-center gap-2 no-underline"
              >
                <HiLocationMarker className="w-4 h-4" /> Start Route Planner
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Middle Grid: Trusted Contacts & Safety Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trusted Contacts Widget */}
        <div className="glass-card p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HiPhone className="w-5 h-5 text-primary-400" />
              <h2 className="font-bold text-white">Trusted Contacts ({contacts.length})</h2>
            </div>
            <Link
              to="/contacts"
              className="text-xs text-primary-400 hover:text-primary-300 font-semibold no-underline"
            >
              Manage
            </Link>
          </div>

          <div className="space-y-3">
            {contacts.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-800/60 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${c.avatarColor || 'bg-primary-500'} flex items-center justify-center text-white font-bold text-sm`}>
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{c.name}</span>
                      {c.isPrimary && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-surface-200/70">
                      {c.relationship} • {c.phone}
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${c.phone}`}
                  className="p-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-200 hover:text-white transition-all no-underline"
                  title="Call contact"
                >
                  <HiPhone className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          <Link
            to="/contacts"
            className="block text-center mt-4 text-xs text-primary-400 hover:text-primary-300 font-medium no-underline"
          >
            + Add or Edit Emergency Contacts
          </Link>
        </div>

        {/* Safety Tools & Tips */}
        <div className="glass-card p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <HiSparkles className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-white">Smart Safety Features</h2>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => setFakeCallOpen(true)}
                className="p-3.5 rounded-xl bg-surface-800/60 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <HiVolumeUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-purple-300">
                      Simulate Fake Call
                    </h3>
                    <p className="text-xs text-surface-200/70">
                      Trigger an incoming ringtone to escape awkward or unsafe encounters
                    </p>
                  </div>
                </div>
                <HiArrowRight className="w-4 h-4 text-surface-200 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="p-3.5 rounded-xl bg-surface-800/60 border border-white/5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <HiOutlineCheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Live Battery Monitoring</h3>
                  <p className="text-xs text-surface-200/70">
                    SafePath alerts contacts if your device battery drops below 15% during travel
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-800/60 border border-white/5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <HiOutlineClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Automatic Check-in Timer</h3>
                  <p className="text-xs text-surface-200/70">
                    Periodic 1-tap pings ensure you haven&apos;t run into unexpected delays
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Journeys */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HiOutlineClock className="w-5 h-5 text-primary-400" />
            <h2 className="font-bold text-white">Recent Journeys</h2>
          </div>
          <Link
            to="/plan"
            className="text-xs text-primary-400 hover:text-primary-300 font-semibold no-underline"
          >
            Plan Another
          </Link>
        </div>

        {recentJourneys.length === 0 ? (
          <p className="text-surface-200 text-sm text-center py-6">
            No past journeys recorded yet. Plan a route to get started!
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {recentJourneys.map((j) => (
              <div
                key={j.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{j.origin}</span>
                    <span className="text-xs text-surface-200">➔</span>
                    <span className="text-sm font-semibold text-white">{j.destination}</span>
                  </div>
                  <div className="text-xs text-surface-200/70 mt-1">
                    {new Date(j.startTime).toLocaleDateString()} • {j.distanceKm} km • {j.durationMins} mins • {j.mode.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      j.safetyScore >= 90 ? 'risk-low' : 'risk-medium'
                    }`}
                  >
                    Safety {j.safetyScore}/100
                  </span>
                  <Link
                    to={`/share/${j.shareToken}`}
                    className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 hover:text-white"
                    title="View Trip Summary"
                  >
                    <HiOutlineExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <SOSModal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} />
      <FakeCallModal isOpen={fakeCallOpen} onClose={() => setFakeCallOpen(false)} />
    </div>
  );
}
