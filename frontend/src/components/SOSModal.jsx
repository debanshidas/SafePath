import { useState, useEffect } from 'react';
import { HiExclamation, HiPhone, HiVolumeUp, HiVolumeOff, HiX, HiCheckCircle } from 'react-icons/hi';
import { playSiren, stopSiren } from '../utils/soundEffects';
import { triggerSOS } from '../services/api';
import { getStoredContacts } from '../services/mockStorage';
import toast from 'react-hot-toast';

export default function SOSModal({ isOpen, onClose }) {
  const [countdown, setCountdown] = useState(5);
  const [dispatched, setDispatched] = useState(false);
  const [sirenOn, setSirenOn] = useState(false);
  const [primaryContact, setPrimaryContact] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      setDispatched(false);
      setSirenOn(false);
      const contacts = getStoredContacts();
      const primary = contacts.find((c) => c.isPrimary) || contacts[0];
      setPrimaryContact(primary);
    } else {
      stopSiren();
    }
  }, [isOpen]);

  // Countdown timer for cancellation
  useEffect(() => {
    if (!isOpen || dispatched) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleDispatch();
    }
  }, [isOpen, countdown, dispatched]);

  const handleDispatch = async () => {
    setDispatched(true);
    // Start siren automatically on dispatch
    setSirenOn(true);
    playSiren();

    try {
      await triggerSOS({
        location: 'Connaught Place Outer Ring, New Delhi (28.6289° N, 77.2190° E)',
        coords: [28.6289, 77.2190],
      });
      toast.success('Emergency SOS Alert Dispatched to contacts & nearest authorities!');
    } catch {
      toast.error('Failed to broadcast SOS to server');
    }
  };

  const toggleSiren = () => {
    if (sirenOn) {
      stopSiren();
      setSirenOn(false);
    } else {
      playSiren();
      setSirenOn(true);
    }
  };

  const handleClose = () => {
    stopSiren();
    setSirenOn(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-card border-danger-500/40 p-6 md:p-8 bg-surface-900/95 overflow-hidden">
        {/* Animated warning background pulse */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-danger-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-surface-200 hover:text-white p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
        >
          <HiX className="w-5 h-5" />
        </button>

        {!dispatched ? (
          /* Countdown State */
          <div className="text-center py-4">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-danger-500/20 border-4 border-danger-500 flex items-center justify-center animate-bounce">
              <span className="text-5xl font-extrabold text-danger-400 font-mono">
                {countdown}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Triggering Emergency SOS
            </h2>
            <p className="text-surface-200 text-sm max-w-sm mx-auto mb-6">
              Dispatching your real-time GPS location and emergency message to{' '}
              <span className="font-semibold text-white">
                {primaryContact ? primaryContact.name : 'your emergency contacts'}
              </span>
              .
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleClose}
                className="btn-secondary px-6 py-3 font-semibold text-base"
              >
                Cancel SOS (False Alarm)
              </button>
              <button
                onClick={handleDispatch}
                className="btn-danger px-6 py-3 font-semibold text-base"
              >
                Send Immediately
              </button>
            </div>
          </div>
        ) : (
          /* Dispatched Active Emergency State */
          <div className="text-center py-2 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-danger-500/20 border border-danger-500 text-danger-400 text-xs font-bold uppercase tracking-wider mb-4 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-danger-500"></span> Emergency Alert Active
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              <HiCheckCircle className="text-emerald-400 w-7 h-7" />
              Alert Successfully Sent!
            </h2>

            <div className="glass-card-light p-4 rounded-xl text-left my-5 space-y-2 border border-white/10">
              <div className="text-xs text-surface-200">Simulated Alert Message:</div>
              <p className="text-sm font-mono text-emerald-300 bg-black/40 p-3 rounded-lg leading-relaxed">
                🚨 EMERGENCY SOS: Priya Sharma requires urgent assistance!
                <br />
                📍 Location: Connaught Place, New Delhi (28.6289° N, 77.2190° E)
                <br />
                🗺️ Live Map: https://safepath.app/share/safe_live_sos
                <br />
                🔋 Battery: 84%
              </p>
              <div className="text-xs text-surface-200/80">
                Delivered via SMS & WhatsApp to: <strong>{primaryContact?.name} ({primaryContact?.phone})</strong>
              </div>
            </div>

            {/* Alarm Sound Toggle */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={toggleSiren}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  sirenOn
                    ? 'bg-danger-600 text-white shadow-lg shadow-danger-600/50'
                    : 'bg-surface-700 text-surface-200 hover:bg-surface-800'
                }`}
              >
                {sirenOn ? (
                  <>
                    <HiVolumeOff className="w-5 h-5 animate-pulse" /> Stop Siren Alarm
                  </>
                ) : (
                  <>
                    <HiVolumeUp className="w-5 h-5" /> Sound Siren Alarm
                  </>
                )}
              </button>
            </div>

            {/* Quick Emergency Helplines */}
            <div className="border-t border-white/10 pt-4">
              <div className="text-xs text-surface-200 mb-3 font-medium">
                Tap to Call Emergency Helplines:
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="tel:112"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-surface-700 hover:bg-surface-800 text-white text-xs font-semibold no-underline border border-white/10"
                >
                  <HiPhone className="text-danger-400 w-4 h-4" /> Call 112 (Police)
                </a>
                <a
                  href="tel:1091"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-surface-700 hover:bg-surface-800 text-white text-xs font-semibold no-underline border border-white/10"
                >
                  <HiPhone className="text-purple-400 w-4 h-4" /> 1091 (Women Helpline)
                </a>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="mt-6 text-surface-200 hover:text-white text-xs underline cursor-pointer bg-transparent border-none"
            >
              Close Emergency Modal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
