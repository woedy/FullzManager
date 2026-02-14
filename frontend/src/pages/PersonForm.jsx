import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPerson, updatePerson, getPerson } from '../services/people';
import { ArrowLeft, Save, Plus, Trash2, FileUp } from 'lucide-react';

// --- Shared Components ---

const InputGroup = ({ label, name, value, onChange, type = "text", required = false, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-sm text-slate-400 mb-1">{label} {required && '*'}</label>
        <input
            type={type}
            name={name}
            value={type !== 'file' ? (value || '') : undefined}
            onChange={onChange}
            required={required}
            className="bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500"
        />
    </div>
);

const SelectGroup = ({ label, name, value, onChange, options, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-sm text-slate-400 mb-1">{label}</label>
        <select name={name} value={value || ''} onChange={onChange} className="bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500">
            <option value="">Select...</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const Section = ({ title, children, onAdd }) => (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h2 className="text-lg font-bold text-blue-400">{title}</h2>
            {onAdd && (
                <button type="button" onClick={onAdd} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded text-sm flex items-center gap-1">
                    <Plus size={16} /> Add
                </button>
            )}
        </div>
        {children}
    </div>
);

const DynamicItem = ({ onDelete, children }) => (
    <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg relative">
        <button type="button" onClick={onDelete} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 p-1">
            <Trash2 size={16} />
        </button>
        {children}
    </div>
);

// --- Main Form Component ---

const PersonForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    // Initial Empty State
    const emptyState = {
        first_name: '', middle_name: '', last_name: '', mother_maiden_name: '',
        sex: '', date_of_birth: '',
        ssn: '', ssn_state_of_issuance: '', ein: '',
        driver_license_number: '', driver_license_issue_date: '', driver_license_expiration: '',
        credit_score: '',
        aliases: [],
        contacts: [],
        addresses: [],
        relatives: [],
        vehicles: [],
        evidence: []
    };

    const [formData, setFormData] = useState(emptyState);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            getPerson(id).then(data => {
                setFormData({
                    ...emptyState,
                    ...data, // merge fetched data
                    aliases: data.aliases || [],
                    contacts: data.contacts || [],
                    addresses: data.addresses || [],
                    relatives: data.relatives || [],
                    vehicles: data.vehicles || [],
                    evidence: data.evidence || []
                });
            });
        }
    }, [id, isEdit]);

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Dynamic List Handlers ---

    const addListObj = (listName, objTemplate) => {
        setFormData(prev => ({ ...prev, [listName]: [...prev[listName], objTemplate] }));
    };

    const removeListObj = (listName, index) => {
        setFormData(prev => ({
            ...prev,
            [listName]: prev[listName].filter((_, i) => i !== index)
        }));
    };

    const updateListObj = (listName, index, field, value) => {
        setFormData(prev => {
            const newList = [...prev[listName]];
            newList[index] = { ...newList[index], [field]: value };
            return { ...prev, [listName]: newList };
        });
    };

    // File handler specifically for evidence using files
    const updateListFile = (listName, index, field, file) => {
        setFormData(prev => {
            const newList = [...prev[listName]];
            newList[index] = { ...newList[index], [field]: file };
            return { ...prev, [listName]: newList };
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const clean = (val) => (val === '' ? null : val);

        // Convert to FormData for multipart/form-data support
        const data = new FormData();

        // Append root fields
        Object.keys(formData).forEach(key => {
            if (typeof formData[key] === 'string' || formData[key] === null || typeof formData[key] === 'number') {
                const val = clean(formData[key]);
                if (val !== null) data.append(key, val);
            }
        });

        // Helper for appending arrays
        const appendList = (listName, keys) => {
            formData[listName].forEach((item, index) => {
                keys.forEach(key => {
                    const val = item[key];
                    if (val !== undefined && val !== null && val !== '') {
                        // DRF nested serializer usually prefers list format: evidence[0]title
                        // But standard Multipart/form-data with multiple files is tricky in DRF default parsers using nested serializers.
                        // We will format keys as 'listName[index]key' (standard HTTP/PHP convention), 
                        // and rely on DRF's MultiPartParser to attempt understanding it OR customized handling.
                        // Actually, DRF default nested writable serializers do NOT built-in support multipart writes for nested data easily.
                        // This might fail without a custom parser or different payload structure.
                        // Strategy: We will try to send everything.
                        data.append(`${listName}[${index}]${key}`, val);
                    }
                });
            });
        };

        // However, standard DRF JSON parser expects:
        // { "evidence": [ { "title": "...", "file": ... } ] }
        // We cannot send JSON + Files mixed easily in one request body unless we use MultiPart and meticulous key naming 
        // that matches specific parser expectations (drf-nested-multipart).
        // Since we didn't install extra libs, and native DRF `MultiPartParser` with `ModelSerializer` primarily works linearly.
        // A common workaround is: Use dot notation for keys: evidence[0].title

        const appendListDot = (listName, keys) => {
            formData[listName].forEach((item, index) => {
                // Always append ID if it exists to support updates
                if (item.id) {
                    data.append(`${listName}[${index}]id`, item.id);
                }

                keys.forEach(key => {
                    const val = item[key];
                    if (val !== undefined && val !== null && val !== '') {
                        // Specific check for file: skip if it's a string (URL)
                        if (key === 'file' && typeof val === 'string') {
                            return;
                        }
                        data.append(`${listName}[${index}]${key}`, val);
                    }
                });
            });
        }

        // Let's rely on `rest_framework.parsers.MultiPartParser` basic capabilities.
        // If this fails, we will have to move files to a separate endpoint or install `drf-writable-nested` with patch.
        // For now, attempting standard array notation.

        appendListDot('aliases', ['name']);
        appendListDot('contacts', ['type', 'value']);
        appendListDot('addresses', ['street', 'city', 'state', 'zip_code', 'country', 'is_current']);
        appendListDot('relatives', ['name', 'relation']);
        appendListDot('vehicles', ['year', 'make', 'model', 'plate_number', 'vin']);
        appendListDot('evidence', ['title', 'external_link', 'description', 'file']);

        try {
            if (isEdit) {
                await updatePerson(id, data);
            } else {
                await createPerson(data);
            }
            navigate('/');
        } catch (error) {
            console.error("Failed to save", error);
            let msg = "Failed to save.";
            if (error.response?.data) msg += " " + JSON.stringify(error.response.data);
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white flex items-center gap-2">
                    <ArrowLeft size={20} /> Cancel
                </button>
                <h1 className="text-2xl font-bold text-white">{isEdit ? 'Edit Profile' : 'Create New Profile'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Core Identity */}
                <Section title="Identity">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="First Name" name="first_name" value={formData.first_name} onChange={handleFieldChange} required />
                        <InputGroup label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleFieldChange} />
                        <InputGroup label="Last Name" name="last_name" value={formData.last_name} onChange={handleFieldChange} required />
                        <InputGroup label="Mother's Maiden Name" name="mother_maiden_name" value={formData.mother_maiden_name} onChange={handleFieldChange} />
                        <SelectGroup label="Sex" name="sex" value={formData.sex} onChange={handleFieldChange}
                            options={[{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'O', label: 'Other' }]}
                        />
                        <InputGroup label="Date of Birth" name="date_of_birth" value={formData.date_of_birth} onChange={handleFieldChange} type="date" />
                    </div>
                </Section>

                {/* Aliases */}
                <Section title="Aliases" onAdd={() => addListObj('aliases', { name: '' })}>
                    <div className="space-y-3">
                        {formData.aliases.map((item, idx) => (
                            <DynamicItem key={idx} onDelete={() => removeListObj('aliases', idx)}>
                                <InputGroup label="Alias Name" value={item.name} onChange={(e) => updateListObj('aliases', idx, 'name', e.target.value)} />
                            </DynamicItem>
                        ))}
                    </div>
                </Section>

                {/* Identification */}
                <Section title="Government IDs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="SSN" name="ssn" value={formData.ssn} onChange={handleFieldChange} />
                        <InputGroup label="SSN State" name="ssn_state_of_issuance" value={formData.ssn_state_of_issuance} onChange={handleFieldChange} />
                        <InputGroup label="EIN" name="ein" value={formData.ein} onChange={handleFieldChange} />
                        <InputGroup label="Driver License" name="driver_license_number" value={formData.driver_license_number} onChange={handleFieldChange} />
                        <InputGroup label="DL Issue Date" name="driver_license_issue_date" value={formData.driver_license_issue_date} onChange={handleFieldChange} type="date" />
                        <InputGroup label="DL Expiration" name="driver_license_expiration" value={formData.driver_license_expiration} onChange={handleFieldChange} type="date" />
                    </div>
                </Section>

                {/* Contacts */}
                <Section title="Contacts" onAdd={() => addListObj('contacts', { type: 'PHONE', value: '' })}>
                    <div className="space-y-3">
                        {formData.contacts.map((item, idx) => (
                            <DynamicItem key={idx} onDelete={() => removeListObj('contacts', idx)}>
                                <div className="flex gap-4">
                                    <SelectGroup label="Type" value={item.type} onChange={(e) => updateListObj('contacts', idx, 'type', e.target.value)}
                                        options={[{ value: 'PHONE', label: 'Phone' }, { value: 'EMAIL', label: 'Email' }]}
                                        className="w-1/3"
                                    />
                                    <InputGroup label="Value" value={item.value} onChange={(e) => updateListObj('contacts', idx, 'value', e.target.value)} className="flex-1" />
                                </div>
                            </DynamicItem>
                        ))}
                    </div>
                </Section>

                {/* Addresses */}
                <Section title="Addresses" onAdd={() => addListObj('addresses', { street: '', city: '', state: '', zip_code: '', country: 'USA', is_current: false })}>
                    <div className="space-y-4">
                        {formData.addresses.map((item, idx) => (
                            <DynamicItem key={idx} onDelete={() => removeListObj('addresses', idx)}>
                                <InputGroup label="Street" value={item.street} onChange={(e) => updateListObj('addresses', idx, 'street', e.target.value)} className="mb-2" />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <InputGroup label="City" value={item.city} onChange={(e) => updateListObj('addresses', idx, 'city', e.target.value)} />
                                    <InputGroup label="State" value={item.state} onChange={(e) => updateListObj('addresses', idx, 'state', e.target.value)} />
                                    <InputGroup label="Zip" value={item.zip_code} onChange={(e) => updateListObj('addresses', idx, 'zip_code', e.target.value)} />
                                    <InputGroup label="Country" value={item.country} onChange={(e) => updateListObj('addresses', idx, 'country', e.target.value)} />
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <input type="checkbox" checked={item.is_current} onChange={(e) => updateListObj('addresses', idx, 'is_current', e.target.checked)} id={`curr_${idx}`} />
                                    <label htmlFor={`curr_${idx}`} className="text-slate-400 text-sm">Is Current Address?</label>
                                </div>
                            </DynamicItem>
                        ))}
                    </div>
                </Section>

                {/* Vehicles */}
                <Section title="Vehicles" onAdd={() => addListObj('vehicles', { make: '', model: '', year: '', plate_number: '', vin: '' })}>
                    <div className="space-y-3">
                        {formData.vehicles.map((item, idx) => (
                            <DynamicItem key={idx} onDelete={() => removeListObj('vehicles', idx)}>
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    <InputGroup label="Year" type="number" value={item.year} onChange={(e) => updateListObj('vehicles', idx, 'year', e.target.value)} />
                                    <InputGroup label="Make" value={item.make} onChange={(e) => updateListObj('vehicles', idx, 'make', e.target.value)} />
                                    <InputGroup label="Model" value={item.model} onChange={(e) => updateListObj('vehicles', idx, 'model', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <InputGroup label="Plate" value={item.plate_number} onChange={(e) => updateListObj('vehicles', idx, 'plate_number', e.target.value)} />
                                    <InputGroup label="VIN" value={item.vin} onChange={(e) => updateListObj('vehicles', idx, 'vin', e.target.value)} />
                                </div>
                            </DynamicItem>
                        ))}
                    </div>
                </Section>

                {/* Relatives */}
                <Section title="Relatives" onAdd={() => addListObj('relatives', { name: '', relation: '' })}>
                    <div className="space-y-3">
                        {formData.relatives.map((item, idx) => (
                            <DynamicItem key={idx} onDelete={() => removeListObj('relatives', idx)}>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputGroup label="Name" value={item.name} onChange={(e) => updateListObj('relatives', idx, 'name', e.target.value)} />
                                    <InputGroup label="Relation" value={item.relation} onChange={(e) => updateListObj('relatives', idx, 'relation', e.target.value)} />
                                </div>
                            </DynamicItem>
                        ))}
                    </div>
                </Section>

                {/* Financial & Evidence */}
                <Section title="Financial & Evidence">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <InputGroup label="Credit Score" name="credit_score" value={formData.credit_score} onChange={handleFieldChange} type="number" />
                    </div>
                </Section>
                <Section title="Evidence Files/Links" onAdd={() => addListObj('evidence', { title: '', external_link: '', description: '' })}>
                    <div className="space-y-3">
                        {formData.evidence.map((item, idx) => (
                            <DynamicItem key={idx} onDelete={() => removeListObj('evidence', idx)}>
                                <InputGroup label="Title" value={item.title} onChange={(e) => updateListObj('evidence', idx, 'title', e.target.value)} className="mb-2" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputGroup label="External Link (URL)" value={item.external_link} onChange={(e) => updateListObj('evidence', idx, 'external_link', e.target.value)} className="mb-2" />
                                    <div className="flex flex-col mb-2">
                                        <label className="text-sm text-slate-400 mb-1">File Upload</label>
                                        <input type="file" onChange={(e) => updateListFile('evidence', idx, 'file', e.target.files[0])} className="text-slate-300 text-sm" />
                                    </div>
                                </div>
                                <InputGroup label="Description" value={item.description} onChange={(e) => updateListObj('evidence', idx, 'description', e.target.value)} />
                            </DynamicItem>
                        ))}
                    </div>
                </Section>

                <div className="flex justify-end pt-6 sticky bottom-6 z-10">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-blue-900/50 flex items-center gap-3 text-lg border-2 border-slate-900"
                    >
                        <Save size={24} /> {loading ? 'Saving...' : 'Save Complete Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PersonForm;
