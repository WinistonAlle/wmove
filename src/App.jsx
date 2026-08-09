import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import { ToastProvider } from './context/ToastContext'
import PrivateRoute from './routes/PrivateRoute'
import ErrorBoundary from './components/ErrorBoundary'

import LandingPage       from './pages/LandingPage'
import LoginPage         from './pages/LoginPage'
import SignupPage        from './pages/SignupPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import TermosPage        from './pages/TermosPage'
import PrivacidadePage   from './pages/PrivacidadePage'
import SobrePage         from './pages/SobrePage'
import AjudaPage         from './pages/AjudaPage'
import StatusPage        from './pages/StatusPage'
import NovidadesPage     from './pages/NovidadesPage'
import MigracaoPage      from './pages/MigracaoPage'
import IntegracoesPage   from './pages/IntegracoesPage'
import OnboardingPage    from './pages/OnboardingPage'
import DashboardPage     from './pages/DashboardPage'
import FrotaPage         from './pages/FrotaPage'
import ClientesPage      from './pages/ClientesPage'
import AlugueisPage      from './pages/AlugueisPage'
import ContratosPage     from './pages/ContratosPage'
import RelatoriosPage    from './pages/RelatoriosPage'
import ConfiguracoesPage from './pages/ConfiguracoesPage'
import OficinaPage       from './pages/OficinaPage'
import MultasPage        from './pages/MultasPage'
import PagamentosPage    from './pages/PagamentosPage'
import AgendamentosPage  from './pages/AgendamentosPage'
import VistoriaPage      from './pages/VistoriaPage'
import SeguroPage        from './pages/SeguroPage'
import FinanceiroPage    from './pages/FinanceiroPage'
import NotificacoesPage  from './pages/NotificacoesPage'
import DocumentosPage    from './pages/DocumentosPage'
import CombustivelPage   from './pages/CombustivelPage'
import SinistrosPage     from './pages/SinistrosPage'
import BillingPage       from './pages/BillingPage'
import NotFoundPage      from './pages/NotFoundPage'
import ImportacaoPage    from './pages/ImportacaoPage'

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <ToastProvider>
          <ErrorBoundary>
            <Routes>
              <Route path="/"                element={<LandingPage />} />
              <Route path="/login"           element={<LoginPage />} />
              <Route path="/cadastro"        element={<SignupPage />} />
              <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
              <Route path="/termos"          element={<TermosPage />} />
              <Route path="/privacidade"     element={<PrivacidadePage />} />
              <Route path="/sobre"           element={<SobrePage />} />
              <Route path="/ajuda"           element={<AjudaPage />} />
              <Route path="/status"          element={<StatusPage />} />
              <Route path="/novidades"       element={<NovidadesPage />} />
              <Route path="/migracao"        element={<MigracaoPage />} />
              <Route path="/integracoes"     element={<IntegracoesPage />} />
              <Route path="/dashboard"     element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path="/frota"         element={<PrivateRoute><FrotaPage /></PrivateRoute>} />
              <Route path="/clientes"      element={<PrivateRoute><ClientesPage /></PrivateRoute>} />
              <Route path="/alugueis"      element={<PrivateRoute><AlugueisPage /></PrivateRoute>} />
              <Route path="/contratos"     element={<PrivateRoute><ContratosPage /></PrivateRoute>} />
              <Route path="/relatorios"    element={<PrivateRoute><RelatoriosPage /></PrivateRoute>} />
              <Route path="/configuracoes" element={<PrivateRoute><ConfiguracoesPage /></PrivateRoute>} />
              <Route path="/oficina"       element={<PrivateRoute><OficinaPage /></PrivateRoute>} />
              <Route path="/multas"        element={<PrivateRoute><MultasPage /></PrivateRoute>} />
              <Route path="/pagamentos"    element={<PrivateRoute><PagamentosPage /></PrivateRoute>} />
              <Route path="/agendamentos"  element={<PrivateRoute><AgendamentosPage /></PrivateRoute>} />
              <Route path="/vistoria"      element={<PrivateRoute><VistoriaPage /></PrivateRoute>} />
              <Route path="/seguro"        element={<PrivateRoute><SeguroPage /></PrivateRoute>} />
              <Route path="/financeiro"    element={<PrivateRoute><FinanceiroPage /></PrivateRoute>} />
              <Route path="/notificacoes"  element={<PrivateRoute><NotificacoesPage /></PrivateRoute>} />
              <Route path="/documentos"    element={<PrivateRoute><DocumentosPage /></PrivateRoute>} />
              <Route path="/combustivel"   element={<PrivateRoute><CombustivelPage /></PrivateRoute>} />
              <Route path="/sinistros"     element={<PrivateRoute><SinistrosPage /></PrivateRoute>} />
              <Route path="/onboarding"    element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
              <Route path="/billing"       element={<PrivateRoute><BillingPage /></PrivateRoute>} />
              <Route path="/importacao"   element={<PrivateRoute><ImportacaoPage /></PrivateRoute>} />
              <Route path="*"             element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </ToastProvider>
      </UserProvider>
    </BrowserRouter>
  )
}
