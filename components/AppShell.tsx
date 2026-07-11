"use client";

import Link from "next/link";
import { ReactNode, useState, useEffect } from "react";
import { 
  LayoutDashboard, Wallet, PiggyBank, FileStack, 
  TrendingUp, Users, HandHeart, Coins, ArrowLeftRight,
  LogOut, Menu, ChevronLeft, ChevronRight, BookOpen, DatabaseBackup,
  type LucideIcon,
} from "lucide-react";
// formatRupiah & formatTanggal sudah di @/lib/format — import langsung dari sana

const NAV_KEUANGAN = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kas", label: "Kas Harian", icon: Wallet },
  { href: "/wallet", label: "Wallet Pos", icon: PiggyBank },
  { href: "/templates", label: "Template", icon: FileStack },
];

const NAV_INVESTASI = [
  { href: "/investasi", label: "Portofolio", icon: TrendingUp },
  { href: "/teman", label: "Inv. Teman", icon: Users },
  { href: "/murobahah", label: "Murobahah", icon: HandHeart },
];

const NAV_LAINNYA = [
  { href: "/utang-piutang", label: "Utang Piutang", icon: ArrowLeftRight },
  { href: "/zakat", label: "Zakat", icon: Coins },
  { href: "/laporan", label: "Laporan", icon: FileStack },
  { href: "/import-lama", label: "Import Lama", icon: DatabaseBackup },
  { href: "/panduan", label: "Panduan", icon: BookOpen },
];

export function AppShell({
  children,
  user,
  active,
}: {
  children: ReactNode;
  user: { nama?: string | null; email: string };
  active: string;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    // Auto-collapse on smaller desktop screens (deterministic default avoids blink on navigation)
    const applyCollapse = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setIsCollapsed(false);
      }
    };
    applyCollapse();
    window.addEventListener('resize', applyCollapse);
    return () => {
      window.removeEventListener('resize', applyCollapse);
    };
  }, []);

  const NavItem = ({ n }: { n: { href: string; label: string; icon: LucideIcon } }) => {
    const isActive = active === n.href;
    const Icon = n.icon;
    return (
      <Link
        href={n.href}
        onClick={() => setIsMobileOpen(false)}
        className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[0.8rem] transition-all group ${
          isActive ? "font-medium" : "hover:bg-white/5"
        }`}
        style={{
          color: isActive ? "var(--accent-gold)" : "var(--text-secondary)",
          backgroundColor: isActive ? "rgba(212,168,67,0.08)" : "transparent",
        }}
        title={isCollapsed ? n.label : undefined}
      >
        <Icon 
          size={16} 
          strokeWidth={isActive ? 2.5 : 1.8}
          className={`flex-shrink-0 ${isActive ? 'text-[var(--accent-gold)]' : 'text-slate-400 group-hover:text-slate-200'} transition-colors`} 
        />
        <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
          {n.label}
        </span>
      </Link>
    );
  };

  const sidebarWidth = isCollapsed ? "w-16" : "w-56";

  return (
    <div className="flex min-h-[100dvh] w-full bg-[var(--bg-base)]">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full flex flex-col z-50 transition-all duration-300 ease-in-out ${sidebarWidth} ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ 
          backgroundColor: "var(--bg-surface)",
          borderRight: "1px solid var(--bg-border)",
        }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-3 py-3.5 border-b shrink-0" style={{ borderColor: "var(--bg-border)", minHeight: '56px' }}>
          <div className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
            <h1 className="text-[0.75rem] font-bold text-[var(--text-primary)] truncate tracking-wider uppercase">Keuangan Pribadi</h1>
            <p className="mt-0.5 text-[0.7rem] text-[var(--text-muted)] truncate">{user.nama || user.email}</p>
          </div>
          <div className={`w-full flex justify-center ${!isCollapsed ? 'hidden' : 'block'}`}>
            <div className="w-7 h-7 rounded-md bg-[var(--accent-gold)]/20 flex items-center justify-center text-[var(--accent-gold)] font-bold text-[0.6rem]">
              KP
            </div>
          </div>
        </div>
        
        {/* Navigation Links */}
        <div className="flex flex-col p-2 flex-1 overflow-y-auto gap-0.5">
          {/* Keuangan */}
          <div className={`px-2.5 pt-3 pb-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] transition-all ${isCollapsed ? 'text-center !px-0' : ''}`}>
            {isCollapsed ? '—' : 'Keuangan'}
          </div>
          {NAV_KEUANGAN.map((n) => <NavItem key={n.href} n={n} />)}

          {/* Investasi */}
          <div className={`px-2.5 pt-4 pb-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] transition-all ${isCollapsed ? 'text-center !px-0' : ''}`}>
             {isCollapsed ? '—' : 'Investasi'}
          </div>
          {NAV_INVESTASI.map((n) => <NavItem key={n.href} n={n} />)}

          {/* Lainnya */}
          <div className={`px-2.5 pt-4 pb-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] transition-all ${isCollapsed ? 'text-center !px-0' : ''}`}>
             {isCollapsed ? '—' : 'Lainnya'}
          </div>
          {NAV_LAINNYA.map((n) => <NavItem key={n.href} n={n} />)}
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-2 border-t mt-auto shrink-0" style={{ borderColor: "var(--bg-border)" }}>
          <form action="/api/auth/logout" method="POST">
            <button 
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} rounded-md px-2.5 py-2 text-[0.8rem] transition-colors text-left group hover:bg-red-500/10`}
              style={{ color: "var(--text-muted)" }}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut size={15} className="text-slate-400 group-hover:text-red-400 transition-colors shrink-0" />
              <span className={`group-hover:text-red-400 transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                Logout
              </span>
            </button>
          </form>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col w-full min-w-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-[var(--bg-base)]/90 backdrop-blur-md border-b border-[var(--bg-border)] min-h-[56px]">
          <div className="flex items-center gap-2">
            {/* Mobile Hamburger */}
            <button 
              className="md:hidden p-1.5 rounded-md hover:bg-white/5 text-[var(--text-secondary)] transition-colors"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={18} />
            </button>
            {/* Desktop Collapse Toggle */}
            <button
              className="hidden md:flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/5 text-[var(--text-secondary)] transition-colors"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-[0.8rem] font-medium text-[var(--text-primary)] md:hidden">
               {active.replace('/', '').charAt(0).toUpperCase() + active.slice(2)}
             </div>
             <div className="text-[0.7rem] font-medium px-2.5 py-1 rounded-full border border-[var(--bg-border)] text-[var(--text-muted)] hidden sm:block">
               {new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date())}
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6 mx-auto max-w-6xl w-full min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
