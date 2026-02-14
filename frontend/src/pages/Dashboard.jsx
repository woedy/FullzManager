import React, { useEffect, useState } from 'react';
import { calculateAge } from '../utils/date';
import { Link } from 'react-router-dom';
import { Search, User, MapPin, Phone, Edit, Trash2, Eye, Play } from 'lucide-react';
import { getPeople, deletePerson, initiatePerson } from '../services/people';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const PaginationControls = ({ page, totalCount, onPageChange }) => {
    const totalPages = Math.ceil(totalCount / 50);
    const maxVisiblePages = 7;

    // Calculate which page numbers to show
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl mt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-slate-400 text-sm">
                    Showing <span className="font-bold text-white">{(page - 1) * 50 + 1}</span> to <span className="font-bold text-white">{Math.min(page * 50, totalCount)}</span> of <span className="font-bold text-white">{totalCount}</span> results
                </div>

                <div className="flex items-center gap-2">
                    {/* First Page */}
                    {startPage > 1 && (
                        <>
                            <button
                                onClick={() => onPageChange(1)}
                                className="px-3 py-2 rounded-lg font-medium transition-colors bg-slate-800 text-white hover:bg-blue-600"
                            >
                                1
                            </button>
                            {startPage > 2 && (
                                <span className="text-slate-500 px-2">...</span>
                            )}
                        </>
                    )}

                    {/* Previous Button */}
                    <button
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${page === 1
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-slate-800 text-white hover:bg-blue-600'
                            }`}
                    >
                        Previous
                    </button>

                    {/* Page Numbers */}
                    {pageNumbers.map((pageNum) => (
                        <button
                            key={pageNum}
                            onClick={() => onPageChange(pageNum)}
                            className={`px-3 py-2 rounded-lg font-medium transition-colors ${pageNum === page
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 text-white hover:bg-blue-600'
                                }`}
                        >
                            {pageNum}
                        </button>
                    ))}

                    {/* Next Button */}
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${page >= totalPages
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-slate-800 text-white hover:bg-blue-600'
                            }`}
                    >
                        Next
                    </button>

                    {/* Last Page */}
                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && (
                                <span className="text-slate-500 px-2">...</span>
                            )}
                            <button
                                onClick={() => onPageChange(totalPages)}
                                className="px-3 py-2 rounded-lg font-medium transition-colors bg-slate-800 text-white hover:bg-blue-600"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}

                    {/* Page Jump Input */}
                    <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-700">
                        <span className="text-slate-400 text-sm">Go to:</span>
                        <input
                            type="number"
                            min="1"
                            max={totalPages}
                            placeholder="Page"
                            className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 text-white text-sm rounded focus:outline-none focus:border-blue-500"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    const targetPage = parseInt(e.target.value);
                                    if (targetPage >= 1 && targetPage <= totalPages) {
                                        onPageChange(targetPage);
                                        e.target.value = '';
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [people, setPeople] = useState([]);
    const [sexFilter, setSexFilter] = useState('');
    const [search, setSearch] = useState('');
    const [stateFilter, setStateFilter] = useState('');
    const [ageRange, setAgeRange] = useState([0, 100]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchPeople = async (searchTerm = '', pageNum = 1) => {
        setLoading(true);
        try {
            const params = { search: searchTerm, page: pageNum, status: 'available' };
            if (sexFilter) params.sex = sexFilter;
            if (stateFilter) params.addresses__state = stateFilter;
            if (ageRange[0] > 0) params.min_age = ageRange[0];
            if (ageRange[1] < 100) params.max_age = ageRange[1];

            const data = await getPeople(params);
            if (data.results) {
                setPeople(data.results);
                setTotalCount(data.count);
            } else {
                setPeople(data);
                setTotalCount(data.length);
            }
        } catch (error) {
            console.error("Failed to fetch people", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchPeople(search, 1);
    }, [sexFilter, stateFilter, ageRange]); // Auto-search on filter change (excluding search text for manual submit)

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchPeople(search, 1);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this profile?')) {
            try {
                await deletePerson(id);
                fetchPeople(search, page);
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    const handleInitiate = async (id) => {
        try {
            await initiatePerson(id);
            fetchPeople(search, page);
        } catch (error) {
            console.error("Failed to initiate", error);
            alert(error.response?.data?.error || "Failed to initiate");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">People Directory</h2>
                <Link to="/add" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Add New Person
                </Link>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, SSN, EIN, city, alias..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                        Search
                    </button>
                </form>

                <div className="flex flex-wrap gap-4 items-center">
                    <select
                        value={sexFilter}
                        onChange={(e) => setSexFilter(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-300 py-2 px-3 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                        <option value="">All Genders</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                    </select>

                    <select
                        value={stateFilter}
                        onChange={(e) => setStateFilter(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-300 py-2 px-3 rounded-lg focus:outline-none focus:border-blue-500 w-48"
                    >
                        <option value="">All States</option>
                        <option value="AL">Alabama</option>
                        <option value="AK">Alaska</option>
                        <option value="AZ">Arizona</option>
                        <option value="AR">Arkansas</option>
                        <option value="CA">California</option>
                        <option value="CO">Colorado</option>
                        <option value="CT">Connecticut</option>
                        <option value="DE">Delaware</option>
                        <option value="FL">Florida</option>
                        <option value="GA">Georgia</option>
                        <option value="HI">Hawaii</option>
                        <option value="ID">Idaho</option>
                        <option value="IL">Illinois</option>
                        <option value="IN">Indiana</option>
                        <option value="IA">Iowa</option>
                        <option value="KS">Kansas</option>
                        <option value="KY">Kentucky</option>
                        <option value="LA">Louisiana</option>
                        <option value="ME">Maine</option>
                        <option value="MD">Maryland</option>
                        <option value="MA">Massachusetts</option>
                        <option value="MI">Michigan</option>
                        <option value="MN">Minnesota</option>
                        <option value="MS">Mississippi</option>
                        <option value="MO">Missouri</option>
                        <option value="MT">Montana</option>
                        <option value="NE">Nebraska</option>
                        <option value="NV">Nevada</option>
                        <option value="NH">New Hampshire</option>
                        <option value="NJ">New Jersey</option>
                        <option value="NM">New Mexico</option>
                        <option value="NY">New York</option>
                        <option value="NC">North Carolina</option>
                        <option value="ND">North Dakota</option>
                        <option value="OH">Ohio</option>
                        <option value="OK">Oklahoma</option>
                        <option value="OR">Oregon</option>
                        <option value="PA">Pennsylvania</option>
                        <option value="RI">Rhode Island</option>
                        <option value="SC">South Carolina</option>
                        <option value="SD">South Dakota</option>
                        <option value="TN">Tennessee</option>
                        <option value="TX">Texas</option>
                        <option value="UT">Utah</option>
                        <option value="VT">Vermont</option>
                        <option value="VA">Virginia</option>
                        <option value="WA">Washington</option>
                        <option value="WV">West Virginia</option>
                        <option value="WI">Wisconsin</option>
                        <option value="WY">Wyoming</option>
                    </select>

                    <div className="w-64 px-2">
                        <label className="text-xs text-slate-400 block mb-1 font-medium">Age Range: {ageRange[0]} - {ageRange[1]}</label>
                        <Slider
                            range
                            min={0}
                            max={100}
                            value={ageRange}
                            onChange={(val) => setAgeRange(val)}
                            trackStyle={[{ backgroundColor: '#3b82f6' }]}
                            handleStyle={[
                                { borderColor: '#3b82f6', backgroundColor: '#1e293b', opacity: 1 },
                                { borderColor: '#3b82f6', backgroundColor: '#1e293b', opacity: 1 }
                            ]}
                            railStyle={{ backgroundColor: '#334155' }}
                        />
                    </div>

                    {(sexFilter || stateFilter || search || ageRange[0] !== 0 || ageRange[1] !== 100) && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setSexFilter('');
                                setStateFilter('');
                                setAgeRange([0, 100]);
                                setPage(1);
                                // fetchPeople() triggered by effects logic refactor or manual call if needed, 
                                // but setState is async. Effect handles it.
                            }}
                            className="text-slate-500 hover:text-white text-sm underline"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading directory...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {people.map((person) => (
                        <div key={person.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-blue-400">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white">
                                            {person.first_name} {person.middle_name} {person.last_name}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            {person.sex === 'M' ? 'Male' : person.sex === 'F' ? 'Female' : 'Other'} • {person.date_of_birth} ({calculateAge(person.date_of_birth)} yrs)
                                        </p>
                                    </div>
                                </div>
                                {/* Used Status Indicator */}
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${person.is_used
                                        ? 'bg-red-900 text-red-300 border border-red-700'
                                        : 'bg-green-900 text-green-300 border border-green-700'
                                    }`}>
                                    {person.is_used ? 'USED' : 'AVAILABLE'}
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                {/* SSN Display */}
                                <div className="flex items-center gap-2 text-slate-300 text-sm">
                                    <div className="w-5 text-slate-500 font-mono text-xs">#</div>
                                    <span className="font-mono text-blue-300">
                                        {person.ssn || 'No SSN'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300 text-sm">
                                    <div className="w-5 text-slate-500"><MapPin size={16} /></div>
                                    <span className="truncate">
                                        {person.addresses && person.addresses.length > 0
                                            ? `${person.addresses[0].city}, ${person.addresses[0].state}`
                                            : 'No address listed'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300 text-sm">
                                    <div className="w-5 text-slate-500"><Phone size={16} /></div>
                                    <span className="truncate">
                                        {person.contacts && person.contacts.length > 0
                                            ? person.contacts[0].value
                                            : 'No contact info'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex border-t border-slate-700 pt-4 gap-2">
                                <button
                                    onClick={() => handleInitiate(person.id)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-center text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <Play size={16} /> Initiate
                                </button>
                                <Link to={`/person/${person.id}`} className="w-10 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-center flex items-center justify-center">
                                    <Eye size={16} />
                                </Link>
                                <Link to={`/edit/${person.id}`} className="w-10 bg-slate-700 hover:bg-blue-600 text-white py-2 rounded text-center flex items-center justify-center">
                                    <Edit size={16} />
                                </Link>
                                <button onClick={() => handleDelete(person.id)} className="w-10 bg-slate-700 hover:bg-red-600 text-white py-2 rounded text-center flex items-center justify-center">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {people.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            No profiles found. Start by adding a new person.
                        </div>
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalCount > 0 && (
                <PaginationControls
                    page={page}
                    totalCount={totalCount}
                    onPageChange={(newPage) => {
                        setPage(newPage);
                        fetchPeople(search, newPage);
                    }}
                />
            )}
        </div>
    );
};

export default Dashboard;
