import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "creator" | "user";
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthReady: boolean;
  login: (userData: AuthUser, token: string, rememberMe?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredAuth = (): { user: AuthUser | null; isPersistent: boolean } => {
  const localUser = localStorage.getItem("user");
  const localToken = localStorage.getItem("token");

  if (localUser && localToken) {
    return {
      user: JSON.parse(localUser) as AuthUser,
      isPersistent: true,
    };
  }

  const sessionUser = sessionStorage.getItem("user");
  const sessionToken = sessionStorage.getItem("token");

  if (sessionUser && sessionToken) {
    return {
      user: JSON.parse(sessionUser) as AuthUser,
      isPersistent: false,
    };
  }

  return {
    user: null,
    isPersistent: false,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuth().user);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  useEffect(() => {
    const storedAuth = getStoredAuth();

    console.log("🔐 AuthContext - Hydrating auth state:", {
      isPersistent: storedAuth.isPersistent,
      hasUser: !!storedAuth.user,
    });

    setUser(storedAuth.user);
    setIsAuthReady(true);
  }, []);

  const login = (userData: AuthUser, token: string, rememberMe = false): void => {
    console.log("🔐 AuthContext - Login called:", {
      rememberMe,
      userData: userData ? "exists" : "null",
      token: token ? "exists" : "null",
    });

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("rememberMe");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");

    if (rememberMe) {
      localStorage.setItem("rememberMe", "true");
      console.log("💾 Remember me preference saved to localStorage");
    }

    const storage = rememberMe ? localStorage : sessionStorage;

    localStorage.setItem("rememberMe", String(rememberMe));
    storage.setItem("user", JSON.stringify(userData));
    storage.setItem("token", token);

    console.log("💾 User data stored in:", rememberMe ? "localStorage" : "sessionStorage");
    setUser(userData);
    setIsAuthReady(true);
  };

  const logout = (): void => {
    console.log("🔐 AuthContext - Logout called");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("rememberedEmail");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setUser(null);
    setIsAuthReady(true);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};