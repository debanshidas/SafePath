import { useState, useEffect } from 'react';
import {
  HiPlus,
  HiTrash,
  HiPencil,
  HiStar,
  HiOutlinePhone,
  HiShieldCheck,
  HiCheckCircle,
  HiX,
  HiOutlineInformationCircle,
} from 'react-icons/hi';
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  setPrimaryContact,
  sendTestAlert,
  getSmsStatus,
} from '../services/api';
import toast from 'react-hot-toast';

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [testAlertOpen, setTestAlertOpen] = useState(false);
  const [testContact, setTestContact] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [smsStatus, setSmsStatus] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: 'Family',
    notifyOnStart: true,
  });

  const loadContacts = async () => {
    try {
      const data = await getContacts();
      setContacts(data || []);
    } catch {
      toast.error('Could not load contacts');
    }
  };

  useEffect(() => {
    loadContacts();
    getSmsStatus().then(setSmsStatus);
  }, []);

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      phone: '',
      relationship: 'Family',
      notifyOnStart: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      notifyOnStart: contact.notifyOnStart,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      return toast.error('Name and Phone are required');
    }

    try {
      if (editingContact) {
        await updateContact(editingContact.id, formData);
        toast.success('Contact updated successfully');
      } else {
        await createContact({
          ...formData,
          isPrimary: contacts.length === 0,
        });
        toast.success('Emergency contact added');
      }
      setModalOpen(false);
      loadContacts();
    } catch {
      toast.error('Failed to save contact');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name} from your trusted emergency contacts?`)) return;

    try {
      await deleteContact(id);
      toast.success(`${name} removed`);
      loadContacts();
    } catch {
      toast.error('Failed to remove contact');
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await setPrimaryContact(id);
      toast.success('Primary contact updated! SOS alerts will target this contact first.');
      loadContacts();
    } catch {
      toast.error('Failed to set primary contact');
    }
  };

  const handleSendTest = async () => {
    setSending(true);
    try {
      const result = await sendTestAlert(testContact.id);
      setSendResult(result);
      if (result.ok) {
        toast.success(`Test SMS sent to ${testContact.name}`);
      } else if (result.status === 'not_configured') {
        toast.error('No SMS provider configured — nothing was sent');
      } else {
        toast.error(`Could not send: ${result.detail || result.status}`);
      }
    } finally {
      setSending(false);
    }
  };

  const triggerTestAlert = (contact) => {
    setSendResult(null);
    setTestContact(contact);
    setTestAlertOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-card p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HiOutlinePhone className="w-6 h-6 text-primary-400" />
            <h1 className="text-2xl font-bold text-white">Emergency Contacts</h1>
          </div>
          <p className="text-surface-200 text-sm">
            Add trusted friends and family who will receive instant SOS alerts and live journey links.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary flex items-center justify-center gap-2 py-2.5 px-4 text-sm whitespace-nowrap cursor-pointer"
        >
          <HiPlus className="w-4 h-4" /> Add Trusted Contact
        </button>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 text-xs text-purple-200 flex items-start gap-3">
        <HiOutlineInformationCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Primary Contact Priority:</strong> When you press
          the Emergency SOS button, every contact below is texted your GPS coordinates,
          battery level and a live tracking link — your primary contact is listed first.
          SafePath does not place phone calls and does not contact police or emergency services.
        </div>
      </div>

      {smsStatus && !smsStatus.smsConfigured && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
          <HiOutlineInformationCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">SMS delivery is off.</strong> Alerts are recorded
            but no message is sent to anyone. Add Twilio credentials to{' '}
            <code className="font-mono">.env</code> to turn on real delivery — see the README.
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {contacts.map((c) => (
          <div
            key={c.id}
            className={`glass-card p-5 border flex flex-col justify-between transition-all ${
              c.isPrimary
                ? 'border-primary-500/50 shadow-lg shadow-primary-500/10 bg-primary-950/20'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div>
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl ${
                      c.avatarColor || 'bg-primary-600'
                    } flex items-center justify-center text-white font-bold text-lg shadow-md`}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      {c.name}
                    </h2>
                    <span className="text-xs text-primary-300 font-medium">
                      {c.relationship}
                    </span>
                  </div>
                </div>

                {c.isPrimary ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-primary-500/20 text-primary-300 border border-primary-500/40 flex items-center gap-1">
                    <HiStar className="w-3 h-3 text-amber-400" /> PRIMARY
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetPrimary(c.id)}
                    className="text-xs text-surface-200 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5 border border-white/5 cursor-pointer"
                    title="Make this contact your primary emergency responder"
                  >
                    <HiStar className="w-3.5 h-3.5 text-surface-200/50" /> Set Primary
                  </button>
                )}
              </div>

              {/* Contact Details */}
              <div className="space-y-2 mb-4 text-xs text-surface-200">
                <div className="flex items-center gap-2 bg-surface-800/40 p-2.5 rounded-lg border border-white/5">
                  <HiOutlinePhone className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-white text-sm">{c.phone}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-surface-200/80">
                  <span>Auto-notify on trip start:</span>
                  <span className={c.notifyOnStart ? 'text-emerald-400 font-medium' : 'text-surface-200/50'}>
                    {c.notifyOnStart ? '✓ Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-white/10 pt-3 flex items-center justify-between">
              <button
                onClick={() => triggerTestAlert(c)}
                className="text-xs text-purple-300 hover:text-purple-200 font-medium cursor-pointer bg-transparent border-none flex items-center gap-1"
              >
                Send Test Alert
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(c)}
                  className="p-2 rounded-lg text-surface-200 hover:text-white hover:bg-white/10 cursor-pointer border-none bg-transparent"
                  title="Edit contact"
                >
                  <HiPencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="p-2 rounded-lg text-danger-400 hover:text-danger-300 hover:bg-danger-500/10 cursor-pointer border-none bg-transparent"
                  title="Delete contact"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-surface-900 border border-white/20 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-surface-200 hover:text-white p-1 rounded-lg bg-white/5 cursor-pointer border-none"
            >
              <HiX className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-200 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Mom, Aarti Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-200 mb-1">
                  Phone Number (with Country Code) *
                </label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-200 mb-1">
                  Relationship
                </label>
                <select
                  className="input-field cursor-pointer"
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Sister">Sister</option>
                  <option value="Brother">Brother</option>
                  <option value="Spouse / Partner">Spouse / Partner</option>
                  <option value="Best Friend">Best Friend</option>
                  <option value="Colleague / Roommate">Colleague / Roommate</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="notifyOnStart"
                  checked={formData.notifyOnStart}
                  onChange={(e) => setFormData({ ...formData, notifyOnStart: e.target.checked })}
                  className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500 bg-surface-800 border-white/20"
                />
                <label htmlFor="notifyOnStart" className="text-xs text-surface-200 cursor-pointer">
                  Send automated SMS alert when I start a night journey
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary flex-1 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 py-2.5 text-sm">
                  {editingContact ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Alert Preview Modal */}
      {testAlertOpen && testContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-surface-900 border border-emerald-500/30 shadow-2xl relative text-left">
            <button
              onClick={() => setTestAlertOpen(false)}
              className="absolute top-4 right-4 text-surface-200 hover:text-white p-1 rounded-lg bg-white/5 cursor-pointer border-none"
            >
              <HiX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <HiShieldCheck className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Send a Test Alert</h3>
            </div>
            <p className="text-xs text-surface-200 mb-4">
              This sends a real SMS to{' '}
              <strong className="text-white">{testContact.name} ({testContact.phone})</strong>,
              clearly marked as a test. An actual emergency alert also includes your live
              location and tracking link.
            </p>

            <div className="bg-black/60 border border-emerald-500/30 rounded-xl p-4 font-mono text-xs text-emerald-300 leading-relaxed mb-4 shadow-inner whitespace-pre-wrap">
              {sendResult?.preview ||
                `SAFEPATH TEST ALERT

Hi ${testContact.name} — this is a test, not a real emergency.

You are set up as a SafePath emergency contact. In a real alert this message would include the sender's live location and a tracking link.`}
            </div>

            {sendResult && (
              <div
                className={`rounded-xl p-3 mb-4 text-xs border ${
                  sendResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}
              >
                {sendResult.ok ? (
                  <>
                    <strong className="text-white">Delivered.</strong> Sent to {sendResult.sentTo}.
                  </>
                ) : sendResult.status === 'not_configured' ? (
                  <>
                    <strong className="text-white">Nothing was sent.</strong> No SMS provider is
                    configured, so this message was not delivered to anyone.
                  </>
                ) : (
                  <>
                    <strong className="text-white">Not delivered.</strong>{' '}
                    {sendResult.detail || sendResult.status}
                  </>
                )}
              </div>
            )}

            <button
              onClick={handleSendTest}
              disabled={sending || sendResult?.ok}
              className="btn-primary w-full py-2.5 text-sm"
            >
              {sending
                ? 'Sending…'
                : sendResult?.ok
                  ? 'Test Alert Sent'
                  : 'Send Test SMS'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
