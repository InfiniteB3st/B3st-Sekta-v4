import React from 'react';
import { motion } from 'motion/react';
import { Shield, HelpCircle, FileText, Lock } from 'lucide-react';

const PageLayout = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <div className="min-h-screen pt-32 pb-20 px-8 bg-[#0f0f0f]">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-12"
    >
      <div className="flex items-center gap-6 border-l-4 border-primary pl-8">
        <Icon className="w-12 h-12 text-primary" />
        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">{title}</h1>
      </div>
      <div className="bg-[#1a1a1a] border border-white/5 rounded-[3rem] p-12 md:p-16 text-gray-400 leading-loose space-y-8 font-medium">
        {children}
      </div>
    </motion.div>
  </div>
);

export const HelpCenter = () => (
  <PageLayout title="Help Center" icon={HelpCircle}>
    <h2 className="text-white text-xl font-bold uppercase tracking-widest">Support</h2>
    <p>Welcome to the B3ST SEKTA support center. If you are experiencing issues with playback or account synchronization, please ensure your internet connection is stable.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
      <div className="p-8 bg-[#0f0f0f] rounded-3xl border border-white/5">
        <h3 className="text-primary font-black uppercase text-xs mb-4">Account Sync</h3>
        <p className="text-sm italic">Status: Fully Operational.</p>
      </div>
      <div className="p-8 bg-[#0f0f0f] rounded-3xl border border-white/5">
        <h3 className="text-primary font-black uppercase text-xs mb-4">Stream Status</h3>
        <p className="text-sm italic">1080p Playback Active.</p>
      </div>
    </div>
  </PageLayout>
);

export const DMCA = () => (
  <PageLayout title="DMCA" icon={Shield}>
    <h2 className="text-white text-xl font-bold uppercase tracking-widest">Copyright Policy</h2>
    <p>B3ST SEKTA is an anime discovery platform. We do not host any files on our servers. All content is indexed from third-party services.</p>
    <p>If you have any copyright concerns, please contact the respective hosting providers as we do not have control over external content.</p>
  </PageLayout>
);

export const Terms = () => (
  <PageLayout title="Terms of Service" icon={FileText}>
    <h2 className="text-white text-xl font-bold uppercase tracking-widest">Usage Agreement</h2>
    <p>By using B3ST SEKTA, you agree to our terms of service. This platform is intended for personal use and discovery of anime content.</p>
    <p>Misuse of the platform or attempt to bypass security measures is strictly prohibited.</p>
  </PageLayout>
);

export const Privacy = () => (
  <PageLayout title="Privacy Policy" icon={Lock}>
    <h2 className="text-white text-xl font-bold uppercase tracking-widest">Data Protection</h2>
    <p>We value your privacy. We only store essential account information such as your username and watchlist to provide a synchronized experience across devices.</p>
    <p>Your data is secured using industry-standard encryption and is never shared with third parties.</p>
  </PageLayout>
);
