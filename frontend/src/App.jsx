import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PersonForm from './pages/PersonForm';
import ImportData from './pages/ImportData';
import PersonDetail from './pages/PersonDetail';
import CreditCards from './pages/CreditCards';
import CreditCardForm from './pages/CreditCardForm';
import CreditCardDetail from './pages/CreditCardDetail';
import InfoStore from './pages/InfoStore';
import Settings from './pages/Settings';
import InAction from './pages/InAction';
import Used from './pages/Used';
import Login from './pages/Login';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/add" element={<PrivateRoute><PersonForm /></PrivateRoute>} />
                    <Route path="/import" element={<PrivateRoute><ImportData /></PrivateRoute>} />
                    <Route path="/edit/:id" element={<PrivateRoute><PersonForm /></PrivateRoute>} />
                    <Route path="/person/:id" element={<PrivateRoute><PersonDetail /></PrivateRoute>} />
                    <Route path="/credit-cards" element={<PrivateRoute><CreditCards /></PrivateRoute>} />
                    <Route path="/credit-cards/add" element={<PrivateRoute><CreditCardForm /></PrivateRoute>} />
                    <Route path="/credit-cards/edit/:id" element={<PrivateRoute><CreditCardForm /></PrivateRoute>} />
                    <Route path="/credit-cards/:id" element={<PrivateRoute><CreditCardDetail /></PrivateRoute>} />
                    <Route path="/in-action" element={<PrivateRoute><InAction /></PrivateRoute>} />
                    <Route path="/used" element={<PrivateRoute><Used /></PrivateRoute>} />
                    <Route path="/info-store" element={<PrivateRoute><InfoStore /></PrivateRoute>} />
                    <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
