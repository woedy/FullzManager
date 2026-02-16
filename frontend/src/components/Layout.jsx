import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UserPlus, CreditCard, Info, Settings as SettingsIcon, Clock, CheckCircle2, Upload } from 'lucide-react';

const Layout = ({ children }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <>{children}</>;
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Fullz Manager
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Personal Data Intelligence</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Dashboard</span>
                    </NavLink>
                    <NavLink to="/add" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
                        <UserPlus size={20} />
                        <span className="font-medium">Add Person</span>
                    </NavLink>
                    <NavLink to="/in-action" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
                        <Clock size={20} />
                        <span className="font-medium">In Action</span>
                    </NavLink>
                    <NavLink to="/used" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
                        <CheckCircle2 size={20} />
                        <span className="font-medium">Used</span>
                    </NavLink>
                    <NavLink to="/credit-cards" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
                        <CreditCard size={20} />
                        <span className="font-medium">Credit Cards</span>
                    </NavLink>
                    <NavLink to="/info-store" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
                        <Info size={20} />
                        <span className="font-medium">Info Store</span>
                    </NavLink>
                    <NavLink to="/import" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
                        <Upload size={20} />
                        <span className="font-medium">Import Data</span>
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
                        <SettingsIcon size={20} />
                        <span className="font-medium">Settings</span>
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all font-medium"
                    >
                        Logout
                    </button>
                </div>

                <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
                    &copy; 2025 Fullz System
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
