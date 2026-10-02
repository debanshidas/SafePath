import { useState, useEffect } from 'react';
import {
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineHeart,
  HiOutlineCog,
  HiCheck,
  HiVolumeUp,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { getStoredProfile, saveProfileSettings } from '../services/mockStorage';
import FakeCallModal from '../components/FakeCallModal';
import toast from 'react-hot-toast';

export default function Profile() {
  const [profile, setProfile] = useState({
    name: 'Priya Sharma',
    email: 'priya@safepath.app',
    phone: '+91 98765 11223',
    bloodGroup: 'O+',
    allergies: 'None reported',
    emergencyNotes: 'Carries inhaler in purse. Speaks English & Hindi.',
    nightSafetyAlerts: true,
    autoShareAfter9PM: true,
    vibrateInRiskZones: true,
    autoCheckInMins: 15,
  });

  const [fakeCallOpen, setFakeCallOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loaded = getStoredProfile();
    if (loaded) setProfile(loaded);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    saveProfileSettings(profile);
    setTimeout(() => {
      setSaving(false);
      toast.success('Safety profile and preferences updated successfully!');
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-card p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineUser className="w-6 h-6 text-primary-400" />
            <h1 className="text-2xl font-bold text-white">Safety Profile & Preferences</h1>
          </div>
          <p className="text-surface-200 text-sm">
            Manage your personal emergency details, medical identity, and intelligent trip safeguards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFakeCallOpen(true)}
          className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 px-4 cursor-pointer"
        >
          <HiVolumeUp className="w-4 h-4 text-purple-400" />
          Test Fake Call
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="glass-card p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-primary-400 font-bold text-base border-b border-white/10 pb-3">
            <HiOutlineUser className="w-5 h-5" />
            Personal Identification
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                className="input-field"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1.5">
                Mobile Phone
              </label>
              <input
                type="tel"
                className="input-field"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Medical & Emergency Identity */}
        <div className="glass-card p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-danger-400 font-bold text-base border-b border-white/10 pb-3">
            <HiOutlineHeart className="w-5 h-5" />
            Emergency Medical Information
          </div>
          <p className="text-xs text-surface-200">
            This information is securely included in emergency SOS dispatches to first responders.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1.5">
                Blood Group
              </label>
              <select
                className="input-field cursor-pointer"
                value={profile.bloodGroup}
                onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-200 mb-1.5">
                Known Allergies or Medications
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Penicillin allergy, None reported"
                value={profile.allergies}
                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-surface-200 mb-1.5">
                Emergency Notes / First Aid Instructions
              </label>
              <textarea
                className="input-field min-h-[80px]"
                rows={3}
                placeholder="Important medical conditions, language preferences, emergency contacts note..."
                value={profile.emergencyNotes}
                onChange={(e) => setProfile({ ...profile, emergencyNotes: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Safety Safeguards & Automations */}
        <div className="glass-card p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base border-b border-white/10 pb-3">
            <HiOutlineShieldCheck className="w-5 h-5" />
            Intelligent Safety Safeguards
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-800/40 border border-white/5">
              <div>
                <h4 className="text-sm font-semibold text-white">Night Safety Mode</h4>
                <p className="text-xs text-surface-200/70">
                  Automatically prioritize well-illuminated commercial roads after 8:00 PM
                </p>
              </div>
              <input
                type="checkbox"
                checked={profile.nightSafetyAlerts}
                onChange={(e) => setProfile({ ...profile, nightSafetyAlerts: e.target.checked })}
                className="w-5 h-5 rounded text-primary-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-800/40 border border-white/5">
              <div>
                <h4 className="text-sm font-semibold text-white">Automatic Trip Sharing</h4>
                <p className="text-xs text-surface-200/70">
                  Automatically send live journey tracking link to your primary contact after 9:00 PM
                </p>
              </div>
              <input
                type="checkbox"
                checked={profile.autoShareAfter9PM}
                onChange={(e) => setProfile({ ...profile, autoShareAfter9PM: e.target.checked })}
                className="w-5 h-5 rounded text-primary-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-800/40 border border-white/5">
              <div>
                <h4 className="text-sm font-semibold text-white">Vibrate on Caution Zones</h4>
                <p className="text-xs text-surface-200/70">
                  Haptic alert when your route enters poorly lit or low foot-traffic segments
                </p>
              </div>
              <input
                type="checkbox"
                checked={profile.vibrateInRiskZones}
                onChange={(e) => setProfile({ ...profile, vibrateInRiskZones: e.target.checked })}
                className="w-5 h-5 rounded text-primary-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary py-3 px-8 text-base font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-primary-500/30"
          >
            <HiCheck className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Profile & Preferences'}
          </button>
        </div>
      </form>

      {/* Fake Call Modal */}
      <FakeCallModal isOpen={fakeCallOpen} onClose={() => setFakeCallOpen(false)} />
    </div>
  );
}
