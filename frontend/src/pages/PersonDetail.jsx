import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPerson, toggleUsedStatus } from '../services/people';
import { calculateAge } from '../utils/date';
import { ArrowLeft, Edit, Calendar, MapPin, Phone, Mail, FileText, Car, Users, CreditCard, Link as LinkIcon, Download, CheckCircle, XCircle } from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon className="text-blue-400" size={24} /> {title}
        </h3>
        {children}
    </div>
);

const Field = ({ label, value }) => (
    <div className="mb-3">
        <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold block mb-1">{label}</label>
        <div className="text-slate-200 font-medium break-words">{value || '-'}</div>
    </div>
);

const PersonDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [person, setPerson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        const fetchPerson = async () => {
            try {
                const data = await getPerson(id);
                setPerson(data);
            } catch (error) {
                console.error("Failed to fetch person", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPerson();
    }, [id]);

    const handleToggleUsed = async () => {
        setToggling(true);
        try {
            const updatedPerson = await toggleUsedStatus(id);
            setPerson(updatedPerson);
        } catch (error) {
            console.error("Failed to toggle used status", error);
        } finally {
            setToggling(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading profile...</div>;
    if (!person) return <div className="p-8 text-center text-slate-400">Person not found</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-6 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} className="mr-2" /> Back to Directory
                </button>
                <div className="flex items-center gap-3">
                    {/* Used Status Toggle */}
                    <button
                        onClick={handleToggleUsed}
                        disabled={toggling}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            person?.is_used 
                                ? 'bg-red-600 hover:bg-red-500 text-white' 
                                : 'bg-green-600 hover:bg-green-500 text-white'
                        } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {person?.is_used ? <XCircle size={18} /> : <CheckCircle size={18} />}
                        {toggling ? 'Updating...' : (person?.is_used ? 'Mark as Available' : 'Mark as Used')}
                    </button>
                    <Link to={`/edit/${id}`} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                        <Edit size={18} /> Edit Profile
                    </Link>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl overflow-hidden mb-8 shadow-2xl">
                <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-8 border-b border-slate-700">
                    <div className="flex items-start justify-between mb-2">
                        <h1 className="text-4xl font-bold text-white">
                            {person.first_name} {person.middle_name} {person.last_name}
                        </h1>
                        {/* Used Status Badge */}
                        <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
                            person.is_used 
                                ? 'bg-red-900 text-red-300 border-2 border-red-700' 
                                : 'bg-green-900 text-green-300 border-2 border-green-700'
                        }`}>
                            {person.is_used ? <XCircle size={16} /> : <CheckCircle size={16} />}
                            {person.is_used ? 'USED' : 'AVAILABLE'}
                        </div>
                    </div>
                    {person.used_date && (
                        <div className="text-slate-400 text-sm mb-4">
                            Marked as used on: {new Date(person.used_date).toLocaleDateString()} at {new Date(person.used_date).toLocaleTimeString()}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-slate-300 mt-4">
                        {person.mother_maiden_name && <span className="bg-slate-800/50 border border-slate-700 px-3 py-1 rounded-full text-sm">MMN: {person.mother_maiden_name}</span>}
                        {person.date_of_birth && <span className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 px-3 py-1 rounded-full text-sm"><Calendar size={14} /> Born: {person.date_of_birth} ({calculateAge(person.date_of_birth)} yrs)</span>}
                        {person.sex && <span className="bg-slate-800/50 border border-slate-700 px-3 py-1 rounded-full text-sm">Sex: {person.sex}</span>}
                    </div>
                    {/* Aliases Section in Header */}
                    {person.aliases && person.aliases.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <span className="text-slate-400 text-sm mr-2">Aliases:</span>
                            <div className="inline-flex flex-wrap gap-2">
                                {person.aliases.map((alias, idx) => (
                                    <span key={idx} className="text-white italic text-sm bg-blue-500/20 px-2 py-0.5 rounded">{alias.name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Section title="Identity & Legal" icon={FileText}>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="SSN" value={person.ssn} />
                        <Field label="SSN State" value={person.ssn_state_of_issuance} />
                        <Field label="EIN" value={person.ein} />
                        <Field label="Driver License" value={person.driver_license_number} />
                        <Field label="DL Issue Date" value={person.driver_license_issue_date} />
                        <Field label="DL Expiration" value={person.driver_license_expiration} />
                    </div>
                </Section>

                <Section title="Contact Information" icon={Phone}>
                    {person.contacts && person.contacts.length > 0 ? (
                        <div className="space-y-3">
                            {person.contacts.map((contact, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                                    {contact.type === 'EMAIL' ? <Mail size={18} className="text-emerald-400" /> : <Phone size={18} className="text-blue-400" />}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-500 font-bold">{contact.type}</span>
                                        <span className="text-slate-200">{contact.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <span className="text-slate-500 italic">No contacts recorded</span>}
                </Section>

                <div className="col-span-1 md:col-span-2">
                    <Section title="Addresses" icon={MapPin}>
                        {person.addresses && person.addresses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {person.addresses.map((addr, idx) => (
                                    <div key={idx} className={`p-4 rounded-lg border ${addr.is_current ? 'bg-blue-900/20 border-blue-800 relative overflow-hidden' : 'bg-slate-700/20 border-slate-700'}`}>
                                        {addr.is_current && <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-bl">CURRENT</div>}
                                        <div className="font-medium text-white text-lg">{addr.street}</div>
                                        <div className="text-slate-300">{addr.city}, {addr.state} {addr.zip_code}</div>
                                        <div className="text-slate-500 text-xs mt-2 uppercase tracking-wider">{addr.country}</div>
                                    </div>
                                ))}
                            </div>
                        ) : <span className="text-slate-500 italic">No addresses recorded</span>}
                    </Section>
                </div>

                <Section title="Vehicles" icon={Car}>
                    {person.vehicles && person.vehicles.length > 0 ? (
                        <div className="space-y-3">
                            {person.vehicles.map((v, idx) => (
                                <div key={idx} className="p-3 bg-slate-700/30 rounded-lg border border-slate-700 flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-white">{v.year} {v.make} {v.model}</div>
                                        <div className="text-sm text-slate-400 mt-1">Plate: <span className="text-slate-200">{v.plate_number}</span></div>
                                    </div>
                                    {v.vin && <div className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-500 font-mono">VIN: {v.vin}</div>}
                                </div>
                            ))}
                        </div>
                    ) : <span className="text-slate-500 italic">No vehicles recorded</span>}
                </Section>

                <Section title="Relatives" icon={Users}>
                    {person.relatives && person.relatives.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {person.relatives.map((rel, idx) => (
                                <div key={idx} className="p-3 bg-slate-700/30 rounded-lg">
                                    <div className="font-medium text-white">{rel.name}</div>
                                    <div className="text-xs text-slate-400 uppercase mt-1">{rel.relation}</div>
                                </div>
                            ))}
                        </div>
                    ) : <span className="text-slate-500 italic">No relatives recorded</span>}
                </Section>

                <div className="col-span-1 md:col-span-2">
                    <Section title="Financial & Evidence" icon={CreditCard}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-slate-900/50 p-4 rounded-lg text-center border border-slate-700">
                                <div className="text-slate-500 text-xs uppercase mb-1">Credit Score</div>
                                <div className={`text-3xl font-bold ${person.credit_score > 700 ? 'text-green-400' : person.credit_score > 600 ? 'text-yellow-400' : 'text-slate-200'}`}>
                                    {person.credit_score || 'N/A'}
                                </div>
                            </div>

                            <div className="md:col-span-3">
                                <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Public Data Evidence</h4>
                                {person.evidence && person.evidence.length > 0 ? (
                                    <div className="space-y-3">
                                        {person.evidence.map((ev, idx) => {
                                            const isImage = ev.file && /\.(jpg|jpeg|png|gif|webp)$/i.test(ev.file);
                                            return (
                                                <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-700/20 rounded border border-slate-700/50">
                                                    <div className="flex items-start gap-4">
                                                        <div className="mt-1 text-blue-400">
                                                            {ev.file ? <FileText size={20} /> : <LinkIcon size={20} />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-white">{ev.title || 'Untitled Evidence'}</div>
                                                            {ev.description && <div className="text-sm text-slate-400 mt-1">{ev.description}</div>}
                                                            <div className="flex gap-4 mt-2">
                                                                {ev.external_link && (
                                                                    <a href={ev.external_link} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline">
                                                                        <LinkIcon size={12} /> Open Link
                                                                    </a>
                                                                )}
                                                                {ev.file && (
                                                                    <a href={ev.file} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline">
                                                                        <Download size={12} /> Download File
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isImage && (
                                                        <div className="mt-2 rounded-lg overflow-hidden border border-slate-700/50">
                                                            <img src={ev.file} alt={ev.title} className="w-full h-auto max-h-96 object-contain bg-slate-900/50" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : <span className="text-slate-500 italic text-sm">No evidence attached</span>}
                            </div>
                        </div>
                    </Section>
                </div>
                <div className="col-span-1 md:col-span-2">
                    <Section title="Notes & Additional Info" icon={FileText}>
                        <div className="whitespace-pre-wrap text-slate-300 bg-slate-900/50 p-4 rounded-lg border border-slate-700 font-mono text-sm">
                            {person.notes || <span className="text-slate-500 italic">No additional notes</span>}
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
};

export default PersonDetail;
