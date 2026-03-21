import Link from "next/link";
import { Settings, Cpu, Package, Activity, ArrowRight } from "lucide-react"; // Optional: npm install lucide-react

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
          <Cpu size={32} />
        </div>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
          Spare<span className="text-blue-600">Hub</span> Management
        </h1>

        <h2 className="mt-4 text-5xl tracking-tight text-zinc-600 dark:text-zinc-400">
         <span className="text-blue-600">System</span>
        </h2>
        <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Advanced Management System for Motor Spares & Electronics. 
          Monitor inventory, track sales, and manage your entire business seamlessly.
        </p>
        <div className="mt-10 flex items-center gap-x-6">
          <Link
            href="/home"
            className="rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all flex items-center gap-2"
          >
            Sales Portal <ArrowRight size={18} />
          </Link>
          <Link 
          href="/admin" 
         className="rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all flex items-center gap-2"
          >
            Admin Panel<span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Quick Stats/Features Grid */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard 
            icon={<Package className="text-blue-500" />}
            title="Inventory Control"
            description="Real-time tracking of motor spares and electronic components via Go API."
          />
          <FeatureCard 
            icon={<Activity className="text-green-500" />}
            title="System Health"
            description="Monitor your Go backend performance and database connectivity."
          />
          <FeatureCard 
            icon={<Settings className="text-purple-500" />}
            title="Global Config"
            description="Manage pricing rules, taxations, and supplier information."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
      <div className="mb-4 h-10 w-10">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}