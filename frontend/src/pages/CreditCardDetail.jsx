import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, CreditCard as CreditCardIcon, Mail, MapPin, User, Calendar, Shield } from 'lucide-react';
import { getCreditCard, deleteCreditCard } from '../services/creditCards';

const CreditCardDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [creditCard, setCreditCard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCreditCard();
    }, [id]);

    const fetchCreditCard = async () => {
        try {
            setLoading(true);
            const data = await getCreditCard(id);
            setCreditCard(data);
        } catch (error) {
            console.error('Error fetching credit card:', error);
            navigate('/credit-cards');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this credit card?')) {
            try {
                await deleteCreditCard(id);
                navigate('/credit-cards');
            } catch (error) {
                console.error('Error deleting credit card:', error);
            }
        }
    };

    const maskCardNumber = (cardNumber) => {
        if (cardNumber.length >= 4) {
            return `****-****-****-${cardNumber.slice(-4)}`;
        }
        return '****-****-****-****';
    };

    const formatCardNumberDisplay = (cardNumber) => {
        // Show full number with spaces for display
        return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!creditCard) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-400">Credit card not found</p>
                <Link to="/credit-cards" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
                    Back to Credit Cards
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/credit-cards')}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="text-slate-400" size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{creditCard.full_name}</h1>
                        <p className="text-slate-400 mt-1">Credit Card Details</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        to={`/credit-cards/edit/${creditCard.id}`}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Edit size={16} />
                        Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    creditCard.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {creditCard.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-slate-400 text-sm">
                    Created: {new Date(creditCard.created_at).toLocaleDateString()}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card Information */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <CreditCardIcon size={20} />
                        Card Information
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Card Number
                            </label>
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-600">
                                <p className="text-white font-mono text-lg">
                                    {formatCardNumberDisplay(creditCard.card_number)}
                                </p>
                                <p className="text-slate-400 text-sm mt-1">
                                    Masked: {maskCardNumber(creditCard.card_number)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    Expiry Date
                                </label>
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-600">
                                    <p className="text-white font-mono flex items-center gap-2">
                                        <Calendar size={16} />
                                        {creditCard.expiry_date}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    CVV
                                </label>
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-600">
                                    <p className="text-white font-mono flex items-center gap-2">
                                        <Shield size={16} />
                                        {creditCard.cvv}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cardholder Information */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <User size={20} />
                        Cardholder Information
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Full Name
                            </label>
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-600">
                                <p className="text-white">{creditCard.full_name}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Email
                            </label>
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-600">
                                <p className="text-white flex items-center gap-2">
                                    <Mail size={16} />
                                    {creditCard.email}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                SSN
                            </label>
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-600">
                                <p className="text-white font-mono">{creditCard.ssn}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 lg:col-span-2">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <MapPin size={20} />
                        Billing Address
                    </h2>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-600">
                        <p className="text-white whitespace-pre-line">{creditCard.address}</p>
                    </div>
                </div>

                {/* Notes */}
                {creditCard.notes && (
                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 lg:col-span-2">
                        <h2 className="text-xl font-semibold text-white mb-4">Notes</h2>
                        <div className="bg-slate-900 p-4 rounded-lg border border-slate-600">
                            <p className="text-white whitespace-pre-line">{creditCard.notes}</p>
                        </div>
                    </div>
                )}

                {/* Metadata */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 lg:col-span-2">
                    <h2 className="text-xl font-semibold text-white mb-4">Metadata</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Created At
                            </label>
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-600">
                                <p className="text-white">
                                    {new Date(creditCard.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Last Updated
                            </label>
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-600">
                                <p className="text-white">
                                    {new Date(creditCard.updated_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditCardDetail;