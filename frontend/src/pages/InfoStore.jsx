import React from 'react';
import { ShieldCheck, Info, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';

const InfoStore = () => {
    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Info className="text-blue-500" size={32} /> Info Store
                </h2>
                <p className="text-slate-400 mt-2">Resources and official ways to check credit reports and scores.</p>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-emerald-900/50 to-slate-900 p-6 border-b border-slate-700">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <CheckCircle className="text-emerald-400" size={24} /> Free & Official Ways (Recommended)
                    </h3>
                </div>
                <div className="p-6 space-y-8">
                    {/* Annual Credit Report */}
                    <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
                        <h4 className="text-lg font-bold text-white mb-2">1. AnnualCreditReport.com (Government-authorized)</h4>
                        <p className="text-slate-300 mb-4">Get free credit reports from Equifax, Experian, and TransUnion.</p>

                        <div className="mb-4">
                            <span className="text-sm uppercase tracking-wider text-slate-500 font-bold block mb-2">You'll need:</span>
                            <ul className="grid grid-cols-2 gap-2 text-slate-300">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> SSN</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Full Name</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Date of Birth</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Address History</li>
                            </ul>
                        </div>

                        <div className="flex items-start gap-3 bg-yellow-500/10 p-3 rounded border border-yellow-500/20 mb-4">
                            <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
                            <p className="text-sm text-yellow-200">This gives credit reports, not always the numeric score (though some bureaus now include it).</p>
                        </div>

                        <a href="https://www.annualcreditreport.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            Visit AnnualCreditReport.com <ExternalLink size={16} />
                        </a>
                    </div>

                    {/* Credit Bureaus Direct */}
                    <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
                        <h4 className="text-lg font-bold text-white mb-4">2. Credit Bureaus (Direct)</h4>
                        <p className="text-slate-300 mb-4">You can check your credit score directly with each bureau. All require SSN and identity verification.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <a href="https://www.experian.com" target="_blank" rel="noreferrer" className="group bg-slate-700 hover:bg-slate-600 p-4 rounded-lg border border-slate-600 hover:border-blue-500 transition-all">
                                <h5 className="font-bold text-white group-hover:text-blue-400 mb-1">Experian</h5>
                                <p className="text-xs text-slate-400">Free FICO Score</p>
                                <ExternalLink size={14} className="mt-3 text-slate-500 group-hover:text-blue-400 ml-auto" />
                            </a>

                            <a href="https://www.equifax.com" target="_blank" rel="noreferrer" className="group bg-slate-700 hover:bg-slate-600 p-4 rounded-lg border border-slate-600 hover:border-blue-500 transition-all">
                                <h5 className="font-bold text-white group-hover:text-blue-400 mb-1">Equifax</h5>
                                <p className="text-xs text-slate-400">Free VantageScore</p>
                                <ExternalLink size={14} className="mt-3 text-slate-500 group-hover:text-blue-400 ml-auto" />
                            </a>

                            <a href="https://www.transunion.com" target="_blank" rel="noreferrer" className="group bg-slate-700 hover:bg-slate-600 p-4 rounded-lg border border-slate-600 hover:border-blue-500 transition-all">
                                <h5 className="font-bold text-white group-hover:text-blue-400 mb-1">TransUnion</h5>
                                <p className="text-xs text-slate-400">Free VantageScore</p>
                                <ExternalLink size={14} className="mt-3 text-slate-500 group-hover:text-blue-400 ml-auto" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900/50 to-slate-900 p-6 border-b border-slate-700">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="text-blue-400" size={24} /> Free Credit Score Apps (Legit)
                    </h3>
                </div>
                <div className="p-6">
                    <p className="text-slate-300 mb-6">These apps require your SSN to verify identity but are generally considered free and safe if downloaded from official stores.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-900/50 rounded-full flex items-center justify-center text-green-400 font-bold">CK</div>
                            <div>
                                <div className="text-white font-bold">Credit Karma</div>
                                <div className="text-xs text-slate-400">TransUnion & Equifax</div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-900/50 rounded-full flex items-center justify-center text-blue-400 font-bold">EX</div>
                            <div>
                                <div className="text-white font-bold">Experian App</div>
                                <div className="text-xs text-slate-400">FICO Score</div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-900/50 rounded-full flex items-center justify-center text-purple-400 font-bold">CS</div>
                            <div>
                                <div className="text-white font-bold">Credit Sesame</div>
                                <div className="text-xs text-slate-400">Credit Monitoring</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoStore;
