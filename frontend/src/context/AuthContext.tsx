import React, { createContext, useContext, useState, useEffect } from 'react';
import { setAuthToken } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  loginUser: (token: string) => void;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


const AuthProvider: React.FC<{ children: React.ReactNode}> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return !!localStorage.getItem("jwt_token");
    });

    useEffect(() => {
        const token = localStorage.getItem("jwt_token");
        if (token) setAuthToken(token);
    }, []);

    const loginUser = (token: string) => {
        localStorage.setItem("jwt_token", token);
        setAuthToken(token);
        setIsAuthenticated(true);
    }

    const logoutUser = () => {
        localStorage.removeItem("jwt_token");
        setAuthToken(null);
        setIsAuthenticated(false);
    }

  return (
    <AuthContext.Provider value={{ isAuthenticated, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  )
}
export default AuthProvider;

export const useAuth = () => {
    const context = useContext(AuthContext);
    if(!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}