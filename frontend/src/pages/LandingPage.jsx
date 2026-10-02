import { Link } from 'react-router-dom';
import { HiShieldCheck, HiLocationMarker, HiShare, HiBell } from 'react-icons/hi';

const features = [
  {
    icon: HiLocationMarker,
    title: 'Smart Route Planning',
    desc: 'View and compare routes with distance, travel time, and safety indicators.',
  },
  {
    icon: HiShieldCheck,
    title: 'Safety Assessment',
    desc: 'Rule-based risk scoring helps you make more informed travel decisions.',
  },
  {
    icon: HiShare,
    title: 'Journey Sharing',
    desc: 'Share your live journey status with a trusted contact.',
  },
  {
    icon: HiBell,
    title: 'Emergency SOS',
    desc: 'One-tap emergency alert sends your location to your trusted contact.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-xl font-bold gradient-text">SafePath</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm no-underline">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm no-underline">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-medium mb-6">
            <HiShieldCheck className="w-4 h-4" />
            Travel safer, stay connected
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Your Safety,{' '}
            <span className="gradient-text">Your Path</span>
          </h1>
          <p className="text-surface-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Plan routes with safety insights, share your journey in real time,
            and alert your trusted contact instantly when you need help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary px-8 py-3 text-base no-underline">
              Create Free Account
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3 text-base no-underline">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            How SafePath <span className="gradient-text">Protects You</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card p-6 hover:border-primary-500/30 transition-all group animate-slide-up">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-surface-200 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-surface-200/60 text-xs">
            ⚠️ SafePath is a safety awareness tool. Risk indicators are based on sample data and are not a guarantee of safety.
            This application does not automatically contact police or emergency services.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center text-surface-200/40 text-xs">
          © {new Date().getFullYear()} SafePath. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
