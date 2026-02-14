import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, CreditCard as CreditCardIcon } from 'lucide-react';
import { createCreditCard, updateCreditCard, getCreditCard } from '../services/creditCards';

const CreditCardForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        card_number: '',
        expiry_date: '',
        cvv: '',
        full_name: '',
        address: '',
        email: '',
        ssn: '',
        is_active: true,
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEditing) {
            fetchCreditCard();
        }
    }, [id, isEditing]);

    const fetchCreditCard = async () => {
        try {
            setLoading(true);
            const data = await getCreditCard(id);
            setFormData(data);
        } catch (error) {
            console.error('Error fetching credit card:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const formatCardNumber = (value) => {
        // Remove all non-digits
        const cleaned = value.replace(/\D/g, '');
        // Add spaces every 4 digits
        const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
        return formatted;
    };

    const formatExpiryDate = (value) => {
        // Remove all non-digits
        const cleaned = value.replace(/\D/g, '');
        // Add slash after 2 digits
        if (cleaned.length >= 2) {
            return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 6);
        }
        return cleaned;
    };

    const handleCardNumberChange = (e) => {
        const formatted = formatCardNumber(e.target.value);
        if (formatted.replace(/\s/g, '').length <= 19) {
            setFormData(prev => ({
                ...prev,
                card_number: formatted.replace(/\s/g, '') // Store without spaces
            }));
        }
    };

    const handleExpiryChange = (e) => {
        const formatted = formatExpiryDate(e.target.value);
        if (formatted.length <= 7) {
            setFormData(prev => ({
                ...prev,
                expiry_date: formatted
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.card_number) {
            newErrors.card_number = 'Card number is required';
        } else if (formData.card_number.length < 13 || formData.card_number.length > 19) {
            newErrors.card_number = 'Card number must be between 13 and 19 digits';
        }

        if (!formData.expiry_date) {
            newErrors.expiry_date = 'Expiry date is required';
        } else if (!/^\d{2}\/\d{4}$/.test(formData.expiry_date)) {
            newErrors.expiry_date = 'Expiry date must be in MM/YYYY format';
        }

        if (!formData.cvv) {
            newErrors.cvv = 'CVV is required';
        } else if (formData.cvv.length < 3 || formData.cvv.length > 4) {
            newErrors.cvv = 'CVV must be 3 or 4 digits';
        }

        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Full name is required';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.ssn.trim()) {
            newErrors.ssn = 'SSN is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            
            if (isEditing) {
                await updateCreditCard(id, formData);
            } else {
                await createCreditCard(formData);
            }
            
            navigate('/credit-cards');
        } catch (error) {
            console.error('Error saving credit card:', error);
            if (error.response?.data) {
                setErrors(error.response.data);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditing) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/credit-cards')}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="text-slate-400" size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        {isEditing ? 'Edit Credit Card' : 'Add Credit Card'}
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {isEditing ? 'Update credit card information' : 'Enter new credit card details'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Card Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CreditCardIcon size={20} />
                            Card Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Card Number *
                                </label>
                                <input
                                    type="text"
                                    name="card_number"
                                    value={formatCardNumber(formData.card_number)}
                                    onChange={handleCardNumberChange}
                                    placeholder="1234 5678 9012 3456"
                                    className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                                        errors.card_number ? 'border-red-500' : 'border-slate-600'
                                    }`}
                                />
                                {errors.card_number && (
                                    <p className="mt-1 text-sm text-red-400">{errors.card_number}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Expiry Date *
                                    </label>
                                    <input
                                        type="text"
                                        name="expiry_date"
                                        value={formData.expiry_date}
                                        onChange={handleExpiryChange}
                                        placeholder="MM/YYYY"
                                        className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                                            errors.expiry_date ? 'border-red-500' : 'border-slate-600'
                                        }`}
                                    />
                                    {errors.expiry_date && (
                                        <p className="mt-1 text-sm text-red-400">{errors.expiry_date}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        CVV *
                                    </label>
                                    <input
                                        type="text"
                                        name="cvv"
                                        value={formData.cvv}
                                        onChange={handleChange}
                                        placeholder="123"
                                        maxLength="4"
                                        className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                                            errors.cvv ? 'border-red-500' : 'border-slate-600'
                                        }`}
                                    />
                                    {errors.cvv && (
                                        <p className="mt-1 text-sm text-red-400">{errors.cvv}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cardholder Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Cardholder Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.full_name ? 'border-red-500' : 'border-slate-600'
                                    }`}
                                />
                                {errors.full_name && (
                                    <p className="mt-1 text-sm text-red-400">{errors.full_name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.email ? 'border-red-500' : 'border-slate-600'
                                    }`}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Address *
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="123 Main St, City, State, ZIP"
                                    rows="3"
                                    className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.address ? 'border-red-500' : 'border-slate-600'
                                    }`}
                                />
                                {errors.address && (
                                    <p className="mt-1 text-sm text-red-400">{errors.address}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    SSN *
                                </label>
                                <input
                                    type="text"
                                    name="ssn"
                                    value={formData.ssn}
                                    onChange={handleChange}
                                    placeholder="123-45-6789"
                                    className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.ssn ? 'border-red-500' : 'border-slate-600'
                                    }`}
                                />
                                {errors.ssn && (
                                    <p className="mt-1 text-sm text-red-400">{errors.ssn}</p>
                                )}
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-600 rounded bg-slate-900"
                                />
                                <label className="ml-2 block text-sm text-slate-300">
                                    Card is active
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Additional notes..."
                            rows="3"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/credit-cards')}
                            className="px-6 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Save size={16} />
                            )}
                            {loading ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreditCardForm;