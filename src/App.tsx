import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import Dashboard from "@/pages/Dashboard";
import Agenda from "@/pages/Agenda";
import Pacientes from "@/pages/Pacientes";
import Medicos from "@/pages/Medicos";
import Unidades from "@/pages/Unidades";
import Perfis from "@/pages/Perfis";
import Configuracoes from "@/pages/Configuracoes";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/medicos" element={<Medicos />} />
            <Route path="/unidades" element={<Unidades />} />
            <Route path="/perfis" element={<Perfis />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}
