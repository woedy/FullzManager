import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, CreditCard as CreditCardIcon, Eye, Edit } from 'lucide-react';
import { getCreditCards, deleteCreditCard, clearAllCreditCards } from '../services/creditCards';

const CreditCards = () => {
    const [creditCards, setCreditCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCards, setFilteredCards] = useState([]);

    useEffect(() => {
        fetchCreditCards();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const filtered = creditCards.filter(card =>
                card.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                card.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                card.card_number.includes(searchTerm)
            );
            setFilteredCards(filtered);
        } else {
            setFilteredCards(creditCards);
        }
    }, [searchTerm, creditCards]);

    const fetchCreditCards = async () => {
        try {
            setLoading(true);
            const data = await getCreditCards();
            setCreditCards(data.results || []);
        } catch (error) {
            console.error('Error fetching credit cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this credit card?')) {
            try {
                await deleteCreditCard(id);
                fetchCreditCards();
            } catch (error) {
                console.error('Error deleting credit card:', error);
            }
        }
    };

    const handleClearAll = async () => {
        if (window.confirm('Are you sure you want to delete ALL credit cards? This action cannot be undone.')) {
            try {
                await clearAllCreditCards();
                fetchCreditCards();
            } catch (error) {
                console.error('Error clearing all credit cards:', error);
            }
        }
    };

    const maskCardNumber = (cardNumber) => {
        if (cardNumber.length >= 4) {
            return `****-****-****-${cardNumber.slice(-4)}`;
        }
        return '****-****-****-****';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Credit Cards</h1>
                    <p className="text-slate-400 mt-1">Manage credit card information</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleClearAll}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Clear All
                    </button>
                    <Link
                        to="/credit-cards/add"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add Credit Card
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by name, email, or card number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Cards</p>
                            <p className="text-2xl font-bold text-white">{creditCards.length}</p>
                        </div>
                        <CreditCardIcon className="text-blue-400" size={24} />
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Active Cards</p>
                            <p className="text-2xl font-bold text-green-400">
                                {creditCards.filter(card => card.is_active).length}
                            </p>
                        </div>
                        <CreditCardIcon className="text-green-400" size={24} />
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Inactive Cards</p>
                            <p className="text-2xl font-bold text-red-400">
                                {creditCards.filter(card => !card.is_active).length}
                            </p>
                        </div>
                        <CreditCardIcon className="text-red-400" size={24} />
                    </div>
                </div>
            </div>

            {/* Credit Cards List */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                {filteredCards.length === 0 ? (
                    <div className="p-8 text-center">
                        <CreditCardIcon className="mx-auto text-slate-600 mb-4" size={48} />
                        <p className="text-slate-400">No credit cards found</p>
                        <Link
                            to="/credit-cards/add"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <Plus size={16} />
                            Add First Credit Card
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900 border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Cardholder
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Card Number
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Expiry
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredCards.map((card) => (
                                    <tr key={card.id} className="hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-white">{card.full_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300 font-mono">
                                                {maskCardNumber(card.card_number)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">{card.expiry_date}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">{card.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                card.is_active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {card.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/credit-cards/${card.id}`}
                                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <Link
                                                    to={`/credit-cards/edit/${card.id}`}
                                                    className="text-yellow-400 hover:text-yellow-300 transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(card.id)}
                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreditCards;