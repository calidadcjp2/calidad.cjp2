import { useState, useEffect, useRef } from "react";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Save, Download, DatabaseBackup, UserPlus, Users, Shield, Pencil, KeyRound, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppRole, APP_ROLE_LABELS, convertLogoUrl } from "@/lib/types";

export default function AdminSettings() {
  const { activities, settings, updateSettings, exportDataToCSV, exportBackupJSON } = useActivities();
  const { user, allUsers, registerUser, updateUser, refreshUsers } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    appName: settings.appName,
    userName: settings.userName,
    userRole: settings.userRole,
    userInitials: settings.userInitials,
    logoUrl: settings.logoUrl || "",
  });

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    role: "consulta" as AppRole,
  });
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    originalUsername: string;
    username: string;
    name: string;
    role: AppRole;
    active: boolean;
    newPassword: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [passwordChangeData, setPasswordChangeData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setFormData({
      appName: settings.appName,
      userName: settings.userName,
      userRole: settings.userRole,
      userInitials: settings.userInitials,
      logoUrl: settings.logoUrl || "",
    });
  }, [settings]);

  const handleSaveSettings = () => {
    const processedLogoUrl = convertLogoUrl(formData.logoUrl);
    updateSettings({ ...formData, logoUrl: processedLogoUrl });
    setFormData(prev => ({ ...prev, logoUrl: processedLogoUrl }));
    toast({
      title: "Configuración guardada",
      description: "Los cambios han sido aplicados exitosamente.",
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "El archivo debe ser una imagen (PNG, JPG, SVG).", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "La imagen no debe superar 2MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
      updateSettings({ logoUrl: dataUrl });
      toast({ title: "Logo cargado", description: "El logo se ha actualizado correctamente." });
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterUser = async () => {
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.name.trim()) return;
    setIsRegistering(true);
    const success = await registerUser(newUser.username, newUser.password, newUser.name, newUser.role);
    setIsRegistering(false);
    if (success) {
      toast({
        title: "Usuario creado",
        description: `El usuario "${newUser.username}" ha sido registrado como ${APP_ROLE_LABELS[newUser.role]}.`,
      });
      setNewUser({ username: "", password: "", name: "", role: "consulta" });
      setUserDialogOpen(false);
    } else {
      toast({
        title: "Error",
        description: "No se pudo crear el usuario. Puede que ya exista.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (u: typeof allUsers[0]) => {
    setEditTarget({
      originalUsername: u.username,
      username: u.username,
      name: u.name,
      role: u.role,
      active: u.active,
      newPassword: "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editTarget) return;
    setIsUpdating(true);
    const updates: any = {
      username: editTarget.username,
      name: editTarget.name,
      role: editTarget.role,
      active: editTarget.active,
    };
    if (editTarget.newPassword.trim()) {
      updates.password = editTarget.newPassword;
    }
    const success = await updateUser(editTarget.originalUsername, updates);
    setIsUpdating(false);
    if (success) {
      toast({
        title: "Usuario actualizado",
        description: `Los datos de "${editTarget.username}" han sido actualizados.`,
      });
      setEditDialogOpen(false);
      setEditTarget(null);
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario.",
        variant: "destructive",
      });
    }
  };

  const handleChangeOwnPassword = async () => {
    if (!passwordChangeData.newPassword.trim()) {
      toast({ title: "Error", description: "Ingrese una nueva contraseña.", variant: "destructive" });
      return;
    }
    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    if (!user) return;
    setIsUpdating(true);
    const success = await updateUser(user.username, { password: passwordChangeData.newPassword });
    setIsUpdating(false);
    if (success) {
      toast({ title: "Contraseña actualizada", description: "Su contraseña ha sido cambiada exitosamente." });
      setPasswordChangeData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      toast({ title: "Error", description: "No se pudo cambiar la contraseña.", variant: "destructive" });
    }
  };

  if (user?.role !== 'administrador') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <Shield className="h-16 w-16 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900">Acceso Restringido</h2>
        <p className="text-slate-500">Solo los administradores pueden acceder a esta sección.</p>
      </div>
    );
  }

  const displayLogoUrl = convertLogoUrl(formData.logoUrl);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Administración</h1>
        <p className="text-slate-500 mt-2 text-lg">Configura los parámetros del sistema, gestiona usuarios y datos.</p>
      </div>

      <Tabs defaultValue="app_settings" className="space-y-4">
        <TabsList className="bg-white border border-slate-200 p-1 flex-wrap h-auto">
          <TabsTrigger value="app_settings">Configuración General</TabsTrigger>
          <TabsTrigger data-testid="tab-users" value="users">Gestión de Usuarios</TabsTrigger>
          <TabsTrigger value="my_account">Mi Cuenta</TabsTrigger>
          <TabsTrigger value="data">Gestión de Datos</TabsTrigger>
        </TabsList>

        <TabsContent value="app_settings" className="space-y-4">
          <Card className="border-slate-200 shadow-sm bg-white max-w-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Personalización de la Aplicación</CardTitle>
              <CardDescription>Cambia el nombre de la app, logo y los detalles de tu perfil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="appName">Nombre de la Aplicación / Institución</Label>
                <Input id="appName" value={formData.appName} onChange={(e) => setFormData({...formData, appName: e.target.value})} className="max-w-md" />
              </div>

              <div className="space-y-3">
                <Label>Logo Institucional</Label>
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        data-testid="input-logo-url"
                        placeholder="https://ejemplo.com/logo.png o URL de Google Drive"
                        value={formData.logoUrl.startsWith('data:') ? '(Archivo cargado)' : formData.logoUrl}
                        onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                        className="flex-1"
                        disabled={formData.logoUrl.startsWith('data:')}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <Button
                        data-testid="button-upload-logo"
                        variant="outline"
                        className="gap-2 shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" /> Subir
                      </Button>
                    </div>
                    {formData.logoUrl.startsWith('data:') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, logoUrl: '' }));
                          updateSettings({ logoUrl: '' });
                        }}
                      >
                        Quitar logo cargado
                      </Button>
                    )}
                    <p className="text-xs text-slate-400">
                      Acepte archivo PNG, JPG, SVG (máx 2MB) o pegue una URL pública. Los enlaces de Google Drive se convierten automáticamente.
                    </p>
                  </div>
                  {displayLogoUrl && (
                    <div className="border border-slate-200 rounded-lg p-2 bg-white shrink-0">
                      <img
                        data-testid="img-logo-preview"
                        src={displayLogoUrl}
                        alt="Logo Preview"
                        className="h-16 max-w-[160px] object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <hr className="my-4 border-slate-100" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="userName">Nombre de Usuario</Label>
                  <Input id="userName" value={formData.userName} onChange={(e) => setFormData({...formData, userName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userInitials">Iniciales</Label>
                  <Input id="userInitials" value={formData.userInitials} onChange={(e) => setFormData({...formData, userInitials: e.target.value})} maxLength={3} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="userRole">Cargo / Organización</Label>
                <Input id="userRole" value={formData.userRole} onChange={(e) => setFormData({...formData, userRole: e.target.value})} className="max-w-md" />
              </div>
              <div className="pt-2">
                <Button onClick={handleSaveSettings} className="gap-2">
                  <Save className="h-4 w-4" /> Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="border-slate-200 shadow-sm bg-white max-w-3xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Usuarios del Sistema</CardTitle>
                <CardDescription>Gestiona quién puede acceder a la plataforma y con qué permisos.</CardDescription>
              </div>
              <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-user" className="gap-2">
                    <UserPlus className="h-4 w-4" /> Nuevo Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Registrar Nuevo Usuario</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Nombre Completo *</Label>
                      <Input
                        data-testid="input-new-user-name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Nombre del profesional"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Usuario *</Label>
                      <Input
                        data-testid="input-new-username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="nombre.usuario"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contraseña *</Label>
                      <Input
                        data-testid="input-new-password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Contraseña segura"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rol de Acceso</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(v) => setNewUser({ ...newUser, role: v as AppRole })}
                      >
                        <SelectTrigger data-testid="select-new-user-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(APP_ROLE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
                      <p><strong>Administrador:</strong> Acceso total, gestión de usuarios y configuración.</p>
                      <p><strong>IAAS:</strong> Módulo IAAS, vigilancia, indicadores y pendientes.</p>
                      <p><strong>Calidad:</strong> Seguridad, reclamos, documentos, tareas, planes, colaboradores.</p>
                      <p><strong>Consulta:</strong> Solo lectura en todos los módulos.</p>
                    </div>
                    <Button
                      data-testid="button-register-user"
                      onClick={handleRegisterUser}
                      disabled={!newUser.username.trim() || !newUser.password.trim() || !newUser.name.trim() || isRegistering}
                      className="w-full mt-2"
                    >
                      {isRegistering ? "Registrando..." : "Crear Usuario"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {allUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p>No hay usuarios registrados.</p>
                  <p className="text-xs mt-1">Inicie sesión con ajara / 1234 para crear el primer usuario.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {allUsers.map((u, idx) => (
                    <div key={idx} data-testid={`row-user-${u.username}`} className={`flex items-center justify-between py-3 px-2 ${!u.active ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full border flex items-center justify-center font-bold text-sm shrink-0 ${u.active ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-red-50 border-red-200 text-red-400'}`}>
                          {u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900">{u.name}</p>
                            {!u.active && <Badge variant="outline" className="text-[10px] border-red-200 text-red-500">Desactivado</Badge>}
                          </div>
                          <p className="text-xs text-slate-500 font-mono">{u.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={u.role === 'administrador' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {APP_ROLE_LABELS[u.role] || u.role}
                        </Badge>
                        <Button
                          data-testid={`button-edit-user-${u.username}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(u)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Usuario</DialogTitle>
              </DialogHeader>
              {editTarget && (
                <div className="grid gap-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Nombre Completo</Label>
                    <Input
                      data-testid="input-edit-user-name"
                      value={editTarget.name}
                      onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nombre de Usuario</Label>
                    <Input
                      data-testid="input-edit-username"
                      value={editTarget.username}
                      onChange={(e) => setEditTarget({ ...editTarget, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nueva Contraseña (dejar vacío para no cambiar)</Label>
                    <Input
                      data-testid="input-edit-password"
                      type="password"
                      value={editTarget.newPassword}
                      onChange={(e) => setEditTarget({ ...editTarget, newPassword: e.target.value })}
                      placeholder="Nueva contraseña..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rol de Acceso</Label>
                    <Select
                      value={editTarget.role}
                      onValueChange={(v) => setEditTarget({ ...editTarget, role: v as AppRole })}
                    >
                      <SelectTrigger data-testid="select-edit-user-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(APP_ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between py-2 px-1">
                    <div>
                      <Label className="text-sm font-medium">Usuario Activo</Label>
                      <p className="text-xs text-slate-500">Los usuarios desactivados no pueden iniciar sesión.</p>
                    </div>
                    <Switch
                      data-testid="switch-edit-user-active"
                      checked={editTarget.active}
                      onCheckedChange={(checked) => setEditTarget({ ...editTarget, active: checked })}
                    />
                  </div>
                  <Button
                    data-testid="button-save-edit-user"
                    onClick={handleUpdateUser}
                    disabled={!editTarget.name.trim() || !editTarget.username.trim() || isUpdating}
                    className="w-full mt-2"
                  >
                    {isUpdating ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="my_account" className="space-y-4">
          <Card className="border-slate-200 shadow-sm bg-white max-w-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="h-5 w-5" /> Cambiar Mi Contraseña
              </CardTitle>
              <CardDescription>Actualiza tu contraseña de acceso al sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                <p>Usuario: <strong className="font-mono">{user?.username}</strong></p>
                <p>Rol: <Badge variant="secondary" className="ml-1">{user ? APP_ROLE_LABELS[user.role] : ''}</Badge></p>
              </div>
              <div className="space-y-1.5">
                <Label>Nueva Contraseña</Label>
                <Input
                  data-testid="input-change-password-new"
                  type="password"
                  value={passwordChangeData.newPassword}
                  onChange={(e) => setPasswordChangeData({ ...passwordChangeData, newPassword: e.target.value })}
                  placeholder="Ingrese nueva contraseña"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar Nueva Contraseña</Label>
                <Input
                  data-testid="input-change-password-confirm"
                  type="password"
                  value={passwordChangeData.confirmPassword}
                  onChange={(e) => setPasswordChangeData({ ...passwordChangeData, confirmPassword: e.target.value })}
                  placeholder="Confirme la nueva contraseña"
                />
              </div>
              <Button
                data-testid="button-change-password"
                onClick={handleChangeOwnPassword}
                disabled={!passwordChangeData.newPassword.trim() || isUpdating}
                className="w-full gap-2"
              >
                <KeyRound className="h-4 w-4" />
                {isUpdating ? "Actualizando..." : "Cambiar Contraseña"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
           <Card className="border-slate-200 shadow-sm bg-white max-w-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Exportación y Respaldo</CardTitle>
                <CardDescription>Descarga la información para análisis externo o guarda copias de seguridad.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-2 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                  <h4 className="font-semibold text-slate-900">Exportar Reporte (CSV)</h4>
                  <p className="text-sm text-slate-500 mb-2">Genera un archivo Excel/CSV con el listado de todos los casos y actividades registrados. Útil para reportes ministeriales.</p>
                  <Button variant="outline" className="w-fit gap-2 bg-white" onClick={exportDataToCSV}>
                    <Download className="w-4 h-4" /> Descargar CSV
                  </Button>
                </div>

                <div className="flex flex-col gap-2 p-4 border border-blue-200 rounded-lg bg-blue-50/30">
                  <h4 className="font-semibold text-blue-900">Respaldo Completo del Sistema (JSON)</h4>
                  <p className="text-sm text-blue-700/80 mb-2">Descarga la base de datos completa incluyendo configuraciones, diccionarios, bitácoras y registros. Guárdalo en el servidor de la clínica por seguridad.</p>
                  <Button className="w-fit gap-2 bg-blue-600 hover:bg-blue-700" onClick={exportBackupJSON}>
                    <DatabaseBackup className="w-4 h-4" /> Generar Backup
                  </Button>
                </div>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
