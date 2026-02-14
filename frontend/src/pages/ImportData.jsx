import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { importPeople } from '../services/people';

const ImportData = () => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState([]);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFiles(Array.from(e.dataTransfer.files));
            setResults([]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
            setResults([]);
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setResults([]);

        const newResults = [];

        // Process files sequentially to avoid overwhelming server
        for (const file of files) {
            try {
                const data = await importPeople(file);
                newResults.push({ name: file.name, status: 'success', data });
            } catch (err) {
                console.error(err);
                newResults.push({
                    name: file.name,
                    status: 'error',
                    error: err.response?.data?.error || "Failed to upload"
                });
            }
            // Update results incrementally
            setResults([...newResults]);
        }

        setUploading(false);
    };

    // Calculate totals
    const totalSuccess = results.reduce((acc, r) => acc + (r.data?.success || 0), 0);
    const totalSkipped = results.reduce((acc, r) => acc + (r.data?.skipped || 0), 0);
    const totalErrors = results.reduce((acc, r) => acc + (r.data?.errors || 0) + (r.status === 'error' ? 1 : 0), 0);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-white">Import Data</h2>
            <p className="text-slate-400">
                Upload multiple data files to populate the database. Supported formats:
                <br />
                - JSON (FullzManager export format)
                <br />
                - Key-Value Text (Standard format)
                <br />
                - Text Blocks (Legacy format)
            </p>

            <div
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors min-h-[300px]
                    ${dragActive ? 'border-blue-500 bg-slate-800' : 'border-slate-700 hover:border-slate-600 bg-slate-900'}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleChange}
                    accept=".txt,.json"
                    multiple
                />

                {files.length === 0 ? (
                    <>
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-blue-400">
                            <Upload size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Drag & Drop files here</h3>
                        <p className="text-slate-400 mb-6">or</p>
                        <label
                            htmlFor="file-upload"
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors"
                        >
                            Browse Files
                        </label>
                    </>
                ) : (
                    <div className="flex flex-col items-center w-full">
                        <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-400">
                            <FileText size={32} />
                        </div>
                        <p className="text-lg text-white font-medium mb-1">{files.length} file(s) selected</p>

                        <div className="flex flex-col gap-2 w-full max-w-md my-4 max-h-48 overflow-y-auto">
                            {files.map((f, i) => (
                                <div key={i} className="flex justify-between text-sm text-slate-400 bg-slate-800 p-2 rounded">
                                    <span className="truncate">{f.name}</span>
                                    <span>{(f.size / 1024).toFixed(1)} KB</span>
                                </div>
                            ))}
                        </div>

                        {!uploading && results.length === 0 && (
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setFiles([])}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    Start Import
                                </button>
                            </div>
                        )}

                        {uploading && (
                            <div className="flex items-center gap-2 text-blue-400">
                                <Loader className="animate-spin" size={20} />
                                <span>Processing file {results.length + 1} of {files.length}...</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {results.length > 0 && !uploading && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="text-green-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Batch Import Complete</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-800 p-4 rounded-lg text-center">
                            <div className="text-3xl font-bold text-white">{totalSuccess}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Total Success</div>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-lg text-center">
                            <div className="text-3xl font-bold text-yellow-500">{totalSkipped}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Total Skipped</div>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-lg text-center">
                            <div className="text-3xl font-bold text-red-500">{totalErrors}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Total Errors</div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <h4 className="font-bold text-white">File Details</h4>
                        {results.map((res, i) => (
                            <div key={i} className={`flex justify-between items-center p-3 rounded ${res.status === 'error' ? 'bg-red-900/20 text-red-300' : 'bg-slate-800 text-slate-300'}`}>
                                <span className="font-medium">{res.name}</span>
                                {res.status === 'error' ? (
                                    <span>Error: {res.error}</span>
                                ) : (
                                    <span className="text-sm">
                                        +{res.data.success} / -{res.data.errors}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => { setFiles([]); setResults([]); }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition-colors mt-4"
                    >
                        Import More Files
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImportData;
