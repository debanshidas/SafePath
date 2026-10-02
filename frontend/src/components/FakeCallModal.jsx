import { useState, useEffect } from 'react';
import { HiPhone, HiPhoneMissedCall, HiVolumeUp, HiVolumeOff, HiX } from 'react-icons/hi';
import { playRingtone, stopRingtone } from '../utils/soundEffects';

export default function FakeCallModal({ isOpen, onClose }) {
  const [callState, setCallState] = useState('incoming'); // 'incoming' | 'connected'
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCallState('incoming');
      setSeconds(0);
      playRingtone();
    } else {
      stopRingtone();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval = null;
    if (callState === 'connected') {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const handleAnswer = () => {
    stopRingtone();
    setCallState('connected');
  };

  const handleDecline = () => {
    stopRingtone();
    onClose();
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-surface-800 to-black rounded-3xl border border-white/20 p-8 shadow-2xl text-center text-white flex flex-col items-center justify-between min-h-[520px]">
        {/* Top bar info */}
        <div className="w-full flex items-center justify-between text-xs text-surface-200/60 mb-6">
          <span>SafePath Fake Call</span>
          <button
            onClick={handleDecline}
            className="text-surface-200 hover:text-white p-1 rounded-full bg-white/10"
          >
            <HiX className="w-4 h-4" />
          </button>
        </div>

        {/* Caller Avatar & Name */}
        <div className="flex flex-col items-center my-auto">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 p-1 mb-4 shadow-xl">
            <div className="w-full h-full rounded-full bg-surface-800 flex items-center justify-center text-4xl">
              👨‍👧
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1">Dad</h3>
          <p className="text-surface-200 text-sm mb-2">+91 98123 00998</p>

          {callState === 'incoming' ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-purple-300 animate-pulse">
              <HiVolumeUp className="w-3.5 h-3.5" /> Incoming Phone Call...
            </div>
          ) : (
            <div className="text-emerald-400 font-mono text-sm tracking-wider">
              {formatTimer(seconds)}
            </div>
          )}
        </div>

        {/* Conversation script hint for the user */}
        {callState === 'connected' && (
          <div className="glass-card-light p-3 text-xs text-surface-200 text-left mb-6 border border-emerald-500/20">
            <strong className="text-emerald-400">Tip:</strong> Talk naturally: &quot;Hey Dad! Yes, I&apos;m just 5 minutes away from the main road, see you outside now.&quot;
          </div>
        )}

        {/* Action Buttons */}
        {callState === 'incoming' ? (
          <div className="w-full flex items-center justify-around mt-6">
            {/* Decline */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleDecline}
                className="w-16 h-16 rounded-full bg-danger-600 hover:bg-danger-700 flex items-center justify-center shadow-lg shadow-danger-600/40 cursor-pointer border-none"
              >
                <HiPhoneMissedCall className="w-8 h-8 text-white" />
              </button>
              <span className="text-xs text-surface-200">Decline</span>
            </div>

            {/* Answer */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleAnswer}
                className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/40 cursor-pointer border-none animate-bounce"
              >
                <HiPhone className="w-8 h-8 text-white" />
              </button>
              <span className="text-xs text-surface-200">Answer</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center mt-6">
            <button
              onClick={handleDecline}
              className="w-16 h-16 rounded-full bg-danger-600 hover:bg-danger-700 flex items-center justify-center shadow-lg shadow-danger-600/40 cursor-pointer border-none"
            >
              <HiPhoneMissedCall className="w-8 h-8 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
