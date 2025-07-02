import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './Pages/Dashboard'
import GrievanceAnalytics from './Pages/GrievanceAnalytics'
import TrendAnalysis from './Pages/TrendAnalysis'
import PredictiveInsights from './Pages/PredictiveInsights'
import Login from './Pages/Login'
import Signup from './Pages/Signup'
import ProtectedRoute from './components/ProtectedRoute'
import FileComplaint from './Pages/FileComplaint'
import JalBoardComplaint from './Pages/JalBoardComplaint'
import ElectricityComplaint from './Pages/ElectricityComplaint'
import GrievancesTable from './components/GrievancesTable.jsx'
import ServiceChatbot from './Pages/ServiceChatbot';
import UserDashboard from './Pages/UserDashboard';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Protected routes */}
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/userdashboard" element={<UserDashboard/>} />
        <Route path="/servicechatbot" element={<ServiceChatbot/>} />
        <Route path="/file-complaint" element={<FileComplaint />} />
        <Route path="/file-complaint/jal-board" element={<ServiceChatbot />} />
        <Route path="/file-complaint/electricity" element={<ElectricityComplaint />} />

        <Route path="/grievances-table" element={<GrievancesTable />} />
        <Route path="/chatbot" element={<ServiceChatbot />} />
        
        <Route path="/analytics" element={<GrievanceAnalytics />} />
        <Route path="/trends" element={<TrendAnalysis />} />
        <Route path="/insights" element={<PredictiveInsights />} />
      </Route>

      {/* Redirect all other routes to login */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default App 