import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import AdminSettings from "@/pages/admin";
import { AreaView } from "@/components/area-view";
import Documents from "@/pages/documents";
import PeriodicTasks from "@/pages/tasks";
import Pending from "@/pages/pending";
import Indicators from "@/pages/indicators";
import ActionPlans from "@/pages/planes-accion";
import Collaborators from "@/pages/colaboradores";
import VigilanciaIAAS from "@/pages/vigilancia-iaas";
import InvestigacionIAAS from "@/pages/investigacion-iaas";
import EventosAdversos from "@/pages/eventos-adversos";
import IndicadoresAuto from "@/pages/indicadores-auto";
import Login from "@/pages/login";
import { ActivityProvider } from "@/context/ActivityContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function ProtectedRoute({ path, children }: { path: string; children: React.ReactNode }) {
  const { user, hasRouteAccess } = useAuth();
  if (!user) return <Redirect to="/login" />;
  if (!hasRouteAccess(path)) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-xl font-bold text-slate-900">Acceso Restringido</h2>
        <p className="text-slate-500 text-center max-w-md">
          Su rol no tiene permisos para acceder a este módulo. Contacte al administrador si necesita acceso.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

function Router() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route>{() => <Redirect to="/login" />}</Route>
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/login">{() => <Redirect to="/" />}</Route>
        <Route path="/">
          {() => <ProtectedRoute path="/"><Home /></ProtectedRoute>}
        </Route>
        <Route path="/dashboard">
          {() => <ProtectedRoute path="/dashboard"><Dashboard /></ProtectedRoute>}
        </Route>
        <Route path="/pendientes">
          {() => <ProtectedRoute path="/pendientes"><Pending /></ProtectedRoute>}
        </Route>
        <Route path="/indicadores">
          {() => <ProtectedRoute path="/indicadores"><Indicators /></ProtectedRoute>}
        </Route>
        <Route path="/planes-accion">
          {() => <ProtectedRoute path="/planes-accion"><ActionPlans /></ProtectedRoute>}
        </Route>
        <Route path="/colaboradores">
          {() => <ProtectedRoute path="/colaboradores"><Collaborators /></ProtectedRoute>}
        </Route>
        <Route path="/calidad">
          {() => <ProtectedRoute path="/calidad"><AreaView area="calidad" title="Calidad" description="Gestión de auditorías, protocolos y mejora continua." /></ProtectedRoute>}
        </Route>
        <Route path="/seguridad_paciente">
          {() => <ProtectedRoute path="/seguridad_paciente"><AreaView area="seguridad_paciente" title="Seguridad del Paciente" description="Reporte de incidentes, eventos adversos y centinelas." /></ProtectedRoute>}
        </Route>
        <Route path="/iaas">
          {() => <ProtectedRoute path="/iaas"><VigilanciaIAAS /></ProtectedRoute>}
        </Route>
        <Route path="/investigacion-iaas">
          {() => <ProtectedRoute path="/investigacion-iaas"><InvestigacionIAAS /></ProtectedRoute>}
        </Route>
        <Route path="/eventos-adversos">
          {() => <ProtectedRoute path="/eventos-adversos"><EventosAdversos /></ProtectedRoute>}
        </Route>
        <Route path="/indicadores-auto">
          {() => <ProtectedRoute path="/indicadores-auto"><IndicadoresAuto /></ProtectedRoute>}
        </Route>
        <Route path="/reclamos">
          {() => <ProtectedRoute path="/reclamos"><AreaView area="reclamos" title="Gestión de Reclamos" description="Seguimiento y resolución de quejas (OIRS)." /></ProtectedRoute>}
        </Route>
        <Route path="/documentos">
          {() => <ProtectedRoute path="/documentos"><Documents /></ProtectedRoute>}
        </Route>
        <Route path="/tareas">
          {() => <ProtectedRoute path="/tareas"><PeriodicTasks /></ProtectedRoute>}
        </Route>
        <Route path="/admin">
          {() => <ProtectedRoute path="/admin"><AdminSettings /></ProtectedRoute>}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActivityProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ActivityProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
