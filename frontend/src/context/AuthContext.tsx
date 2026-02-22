import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (userData: AuthUser, token: string, rememberMe?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const rememberMe = localStorage.getItem("rememberMe") === "true";
    const storage = rememberMe ? localStorage : sessionStorage;

    const storedUser = storage.getItem("user");
    const storedToken = storage.getItem("token");

    console.log("🔐 AuthContext - Loading user on app start:", {
      rememberMe,
      storage: rememberMe ? "localStorage" : "sessionStorage",
      hasUser: !!storedUser,
      hasToken: !!storedToken,
    });

    if (storedUser && storedToken) {
      console.log("✅ AuthContext - User found, setting user state");
      setUser(JSON.parse(storedUser) as AuthUser);
    } else {
      console.log("❌ AuthContext - No user found in storage");
    }
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

    storage.setItem("user", JSON.stringify(userData));
    storage.setItem("token", token);

    console.log("💾 User data stored in:", rememberMe ? "localStorage" : "sessionStorage");
    setUser(userData);
  };

  const logout = (): void => {
    console.log("🔐 AuthContext - Logout called");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("rememberedEmail");
    localStorage.removeItem("rememberedPassword");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};