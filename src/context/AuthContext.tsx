// src/context/AuthContext.tsx

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
// --- FIX 1: Importar los tipos 'User' y 'Usuario' que necesitamos ---
import { Api, type User, type Usuario } from "../lib/Api";

type UsuarioApp = {
    codigo: number;
    nombre: string;
    apellido: string;
    correoelectronico: string;
    idtipousuario: number;
    subtipo: string;
    recibir_notificaciones?: boolean;
};

type AuthState = {
    token: string | null;
    user: UsuarioApp | null;
    isAuth: boolean;
    loading: boolean;
    loginFromStorage: () => Promise<void>;
    refreshUser: () => Promise<void>;
    logout: () => void;
    adoptToken: (tk: string, preload?: { user?: User; usuario?: Usuario }) => Promise<void>;
    updateNotificationSetting: (newSetting: boolean) => void;
};

const AuthCtx = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<UsuarioApp | null>(null);
    const [loading, setLoading] = useState(true);

    const loginFromStorage = async () => {
        console.log("=== LOGIN FROM STORAGE ===");
        const storedToken = localStorage.getItem("auth_token");
        const storedUser = localStorage.getItem("user_data");

        console.log("Token almacenado:", !!storedToken);
        console.log("UserData almacenado:", storedUser);

        if (!storedToken || !storedUser) {
            setLoading(false);
            return;
        }

        try {
            const userData = JSON.parse(storedUser);
            console.log("UserData parseado:", userData);

            setToken(storedToken);
            setUser(userData); // Aquí debería ser el objeto completo
            Api.defaults.headers.common["Authorization"] = `Token ${storedToken}`;

            await Api.get("/auth/user/");
            console.log("Validación de token exitosa");
        } catch (error) {
            console.error("Error validando token:", error);
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_data");
            delete (Api.defaults.headers as any).Authorization;
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loginFromStorage();
    }, []);

    const refreshUser = async () => {
        if (!token) return;
        try {
            // --- FIX 2: La respuesta de /auth/user/ es anidada, la aplanamos aquí ---
            const { data } = await Api.get<{ user: User; usuario: Usuario }>("/auth/user/");
            const fullUser: UsuarioApp = {
                codigo: data.usuario.codigo,
                nombre: data.usuario.nombre,
                apellido: data.usuario.apellido,
                correoelectronico: data.user.email,
                idtipousuario: data.usuario.idtipousuario,
                subtipo: data.usuario.subtipo,
                recibir_notificaciones: data.usuario.recibir_notificaciones
            };
            setUser(fullUser);
            localStorage.setItem("user_data", JSON.stringify(fullUser));
        } catch (e) {
            console.error("Failed to refresh user", e);
            logout();
        }
    };

    const logout = () => {
        const tk = token;

        (async () => {
            try {
                await Api.get("/auth/csrf/").catch(() => { /* no-op */ });

                await Api.post("/auth/logout/", null, {
                    headers: tk ? { Authorization: `Token ${tk}` } : undefined,
                });
            } catch (e) {
                console.warn("No se pudo cerrar sesión en el servidor (continuo limpiando estado):", e);
            }
        })();

        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        delete (Api.defaults.headers as any).Authorization;
        setToken(null);
        setUser(null);
        setLoading(false);
    };

    const adoptToken = async (tk: string, preload?: { user?: User; usuario?: Usuario }) => {
        console.log("=== ADOPT TOKEN START ===");
        console.log("Token:", tk);
        console.log("Preload:", preload);

        setLoading(true);

        try {
            localStorage.setItem("auth_token", tk);
            setToken(tk);
            Api.defaults.headers.common["Authorization"] = `Token ${tk}`;

            if (preload?.user && preload.usuario) {
                console.log("Usando preload data");
                const fullUser: UsuarioApp = {
                    codigo: preload.usuario.codigo,
                    nombre: preload.usuario.nombre,
                    apellido: preload.usuario.apellido,
                    correoelectronico: preload.user.email,
                    idtipousuario: preload.usuario.idtipousuario,
                    subtipo: preload.usuario.subtipo,
                    recibir_notificaciones: preload.usuario.recibir_notificaciones
                };

                console.log("FullUser creado:", fullUser);
                setUser(fullUser);
                localStorage.setItem("user_data", JSON.stringify(fullUser));
                console.log("Usuario guardado en localStorage");
            } else {
                console.log("Sin preload, refrescando user...");
                await refreshUser();
            }
        } catch (error) {
            console.error("Error en adoptToken:", error);
        } finally {
            setLoading(false);
            console.log("=== ADOPT TOKEN END ===");
        }
    };

    // --- FIX 3: Definimos la función ANTES de usarla en `useMemo` ---
    // La envolvemos en `useCallback` por optimización
    const updateNotificationSetting = useCallback((newSetting: boolean) => {
        setUser(currentUser => {
            if (!currentUser) return null;
            const updatedUser = { ...currentUser, recibir_notificaciones: newSetting };
            localStorage.setItem('user_data', JSON.stringify(updatedUser));
            return updatedUser;
        });
    }, []);

    const value: AuthState = useMemo(
        () => ({
            token,
            user,
            isAuth: !!token && !!user,
            loading,
            loginFromStorage,
            refreshUser,
            logout,
            adoptToken,
            // --- FIX 4: Añadimos la función al objeto del contexto ---
            updateNotificationSetting
        }),
        [token, user, loading, updateNotificationSetting]
    );

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = (): AuthState => {
    const ctx = useContext(AuthCtx);
    if (ctx) return ctx;

    // --- FIX 5: Añadimos la función al objeto de retorno por defecto ---
    // Esto evita errores si el contexto no se encuentra
    return {
        token: null,
        user: null,
        isAuth: false,
        loading: false,
        loginFromStorage: async () => {},
        refreshUser: async () => {},
        logout: () => {},
        adoptToken: async () => {},
        updateNotificationSetting: () => {}, // Función vacía por defecto
    };
};
