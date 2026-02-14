import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

const Settings = () => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleClearData = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/people/clear_all/`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const data = await response.json();
                setMessage({ type: 'success', text: data.message || 'Data cleared successfully.' });
                setShowConfirm(false);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to clear data');
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8">Settings</h2>

            {/* Danger Zone */}
            <div className="bg-red-900/10 border border-red-500/20 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-500/10 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2">Danger Zone</h3>
                            <p className="text-slate-400 mb-6">
                                Irreversible actions that affect your entire dataset. Please proceed with caution.
                            </p>

                            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-red-500/10">
                                <div>
                                    <h4 className="text-white font-medium">Clear All Data</h4>
                                    <p className="text-sm text-slate-500">Permanently delete all persons and associated records.</p>
                                </div>
                                <button
                                    onClick={() => setShowConfirm(true)}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Clear All Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback Message */}
            {message && (
                <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-900/20 border-green-500/20 text-green-400' : 'bg-red-900/20 border-red-500/20 text-red-400'}`}>
                    {message.text}
                </div>
            )}


            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Are you absolutely sure?</h3>
                        <p className="text-slate-300 mb-6">
                            This action cannot be undone. This will permanently delete all records from the database.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearData}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Clearing...' : 'Yes, Delete Everything'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
