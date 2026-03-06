import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppUser, AppRole, ROLE_PERMISSIONS } from '../lib/types';
import { fetchSheet, postToSheet } from '../lib/sheetsApi';

interface AuthContextType {
  user: AppUser | null;
  isAuthLoading: boolean;
  authError: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRouteAccess: (route: string) => boolean;
  canEdit: boolean;
  registerUser: (username: string, password: string, name: string, role: AppRole) => Promise<boolean>;
  updateUser: (originalUsername: string, updates: { username?: string; password?: string; name?: string; role?: AppRole; active?: boolean }) => Promise<boolean>;
  allUsers: AppUser[];
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'healthmanage_session';

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

function deduplicateUsers(rows: any[]): any[] {
  const userMap = new Map<string, any>();
  for (const row of rows) {
    const username = (row.username || row.usuario || '').toLowerCase();
    if (username) {
      userMap.set(username, row);
    }
  }
  return Array.from(userMap.values());
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [usersCache, setUsersCache] = useState<any[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const rows = await fetchSheet("USUARIOS");
      const deduped = deduplicateUsers(rows);
      setUsersCache(deduped);
      setAllUsers(deduped.map((r: any) => ({
        username: (r.username || r.usuario || '').toLowerCase(),
        name: r.name || r.nombre || '',
        role: (r.role || r.rol || 'consulta') as AppRole,
        active: r.active === undefined || r.active === null || r.active === '' || r.active === 'true' || r.active === true,
      })));
      return deduped;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsAuthLoading(true);
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AppUser;
          if (parsed.username && parsed.role) {
            setUser({ ...parsed, active: parsed.active !== false });
          }
        } catch {}
      }
      await fetchUsers();
      setIsAuthLoading(false);
    };
    init();
  }, [fetchUsers]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      let rows = usersCache;
      if (rows.length === 0) {
        rows = await fetchUsers() || [];
      }

      const hashed = hashPassword(password);
      const found = rows.find((r: any) => {
        const u = (r.username || r.usuario || '').toLowerCase();
        const p = r.password || r.clave || '';
        return u === username.toLowerCase() && p === hashed;
      });

      if (!found) {
        if (rows.length === 0) {
          const defaultUser: AppUser = {
            username: 'ajara',
            name: 'Administrador',
            role: 'administrador',
            active: true,
          };
          if (username.toLowerCase() === 'ajara' && password === '1234') {
            setUser(defaultUser);
            localStorage.setItem(SESSION_KEY, JSON.stringify(defaultUser));
            await postToSheet("USUARIOS", ['ajara', hashPassword('1234'), 'Administrador', 'administrador', 'true']);
            await fetchUsers();
            return true;
          }
        }
        setAuthError('Usuario o contraseña incorrectos');
        return false;
      }

      const isActive = found.active === undefined || found.active === null || found.active === '' || found.active === 'true' || found.active === true;
      if (!isActive) {
        setAuthError('Este usuario está desactivado. Contacte al administrador.');
        return false;
      }

      const appUser: AppUser = {
        username: (found.username || found.usuario || '').toLowerCase(),
        name: found.name || found.nombre || '',
        role: (found.role || found.rol || 'consulta') as AppRole,
        active: true,
      };

      setUser(appUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(appUser));
      return true;
    } catch (err: any) {
      setAuthError('Error al conectar con el servidor');
      return false;
    }
  }, [usersCache, fetchUsers]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const hasRouteAccess = useCallback((route: string): boolean => {
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role];
    if (perms.allowedRoutes.includes('*')) return true;
    return perms.allowedRoutes.some(r => route === r || (r !== '/' && route.startsWith(r)));
  }, [user]);

  const canEdit = user ? ROLE_PERMISSIONS[user.role].canEdit : false;

  const registerUser = useCallback(async (username: string, password: string, name: string, role: AppRole): Promise<boolean> => {
    try {
      const existing = usersCache.find((r: any) =>
        (r.username || r.usuario || '').toLowerCase() === username.toLowerCase()
      );
      if (existing) {
        setAuthError('El usuario ya existe');
        return false;
      }
      const hashed = hashPassword(password);
      await postToSheet("USUARIOS", [username.toLowerCase(), hashed, name, role, 'true']);
      await fetchUsers();
      return true;
    } catch {
      setAuthError('Error al registrar usuario');
      return false;
    }
  }, [usersCache, fetchUsers]);

  const updateUser = useCallback(async (
    originalUsername: string,
    updates: { username?: string; password?: string; name?: string; role?: AppRole; active?: boolean }
  ): Promise<boolean> => {
    try {
      const existing = usersCache.find((r: any) =>
        (r.username || r.usuario || '').toLowerCase() === originalUsername.toLowerCase()
      );
      if (!existing) {
        setAuthError('Usuario no encontrado');
        return false;
      }

      if (updates.username && updates.username.toLowerCase() !== originalUsername.toLowerCase()) {
        const duplicate = usersCache.find((r: any) =>
          (r.username || r.usuario || '').toLowerCase() === updates.username!.toLowerCase()
        );
        if (duplicate) {
          setAuthError('El nombre de usuario ya está en uso');
          return false;
        }
      }

      const newUsername = (updates.username || originalUsername).toLowerCase();
      const newPassword = updates.password ? hashPassword(updates.password) : (existing.password || existing.clave || '');
      const newName = updates.name || existing.name || existing.nombre || '';
      const newRole = updates.role || existing.role || existing.rol || 'consulta';
      const newActive = updates.active !== undefined ? (updates.active ? 'true' : 'false') : (existing.active || 'true');

      await postToSheet("USUARIOS", [newUsername, newPassword, newName, newRole, newActive]);

      if (user && user.username === originalUsername.toLowerCase()) {
        const updatedUser: AppUser = {
          username: newUsername,
          name: newName,
          role: newRole as AppRole,
          active: newActive === 'true',
        };
        setUser(updatedUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
      }

      await fetchUsers();
      return true;
    } catch {
      setAuthError('Error al actualizar usuario');
      return false;
    }
  }, [usersCache, fetchUsers, user]);

  const refreshUsers = fetchUsers;

  return (
    <AuthContext.Provider value={{
      user, isAuthLoading, authError,
      login, logout, hasRouteAccess, canEdit,
      registerUser, updateUser, allUsers, refreshUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
