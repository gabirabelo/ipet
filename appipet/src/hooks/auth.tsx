import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-community/async-storage";

import api from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  address_line: string;
  number: string;
  city: string;
  state: string;
  complement: string;
}

interface AuthState {
  token: string;
  user: User;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthContextData {
  user: User;
  loading: boolean;
  signIn(credentials: SignInCredentials): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const AuthProvider: React.FC = ({ children }) => {
  const [data, setData] = useState<AuthState>({} as AuthState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoragedData(): Promise<void> {
      const [token, user] = await AsyncStorage.multiGet([
        "@Ipet:token",
        "@Ipet:user",
      ]);

      if (token[1] && user[1]) {
        api.defaults.headers.authorization = `Bearer ${token}`;

        setData({ token: token[1], user: JSON.parse(user[1]) });
      }
      setLoading(false);
    }

    loadStoragedData();
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const response = await api.post("sessions", {
      email,
      password,
    });

    const { token, user } = response.data;

    await AsyncStorage.multiSet([
      ["@Ipet:token", token],
      ["@Ipet:user", JSON.stringify(user)],
    ]);

    setData({ token, user });

    api.defaults.headers.authorization = `Bearer ${token}`;
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(["@Ipet:user", "@Ipet:token"]);

    setData({} as AuthState);
  }, []);

  return (
    <AuthContext.Provider value={{ user: data.user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export { AuthProvider, useAuth };
