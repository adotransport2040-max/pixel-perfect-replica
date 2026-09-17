import React from 'react';
import { LayoutDashboard, ShoppingCart, TrendingUp, FileText, BookOpen } from 'lucide-react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  purchaseCount: number;
  salesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  purchaseCount,
  salesCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'purchase' as ActiveTab,
      label: 'Purchase Bills',
      icon: ShoppingCart,
      badge: purchaseCount > 0 ? purchaseCount : null,
    },
    {
      id: 'sales' as ActiveTab,
      label: 'Sales Bills',
      icon: TrendingUp,
      badge: salesCount > 0 ? salesCount : null,
    },
    {
      id: 'vat-return' as ActiveTab,
      label: 'Monthly VAT Return',
      icon: FileText,
      badge: 'IRD',
    },
    {
      id: 'party-ledger' as ActiveTab,
      label: 'Party Ledger',
      icon: BookOpen,
      badge: null,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs print:hidden" id="main-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span
                    className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-medium ${
                      isActive
                        ? 'bg-teal-800 text-teal-100'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
