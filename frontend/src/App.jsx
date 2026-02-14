import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/add" element={<PersonForm />} />
                    <Route path="/import" element={<ImportData />} />
                    <Route path="/edit/:id" element={<PersonForm />} />
                    <Route path="/person/:id" element={<PersonDetail />} />
                    <Route path="/credit-cards" element={<CreditCards />} />
                    <Route path="/credit-cards/add" element={<CreditCardForm />} />
                    <Route path="/credit-cards/edit/:id" element={<CreditCardForm />} />
                    <Route path="/credit-cards/:id" element={<CreditCardDetail />} />
                    <Route path="/in-action" element={<InAction />} />
                    <Route path="/used" element={<Used />} />
                    <Route path="/info-store" element={<InfoStore />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
