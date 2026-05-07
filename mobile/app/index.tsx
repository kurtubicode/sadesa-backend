import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "@/lib/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("ahmad@gmail.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true); // State untuk loading awal

  const router = useRouter();

  // Efek ini berjalan otomatis saat aplikasi pertama kali dibuka
  useEffect(() => {
    const checkUserToken = async () => {
      try {
        // Cek apakah ada token tersimpan di memori HP
        const userToken = await SecureStore.getItemAsync("sadesa_user_token");

        if (userToken) {
          // Jika ada token, lewati login dan langsung ke beranda
          router.replace("/(tabs)");
        } else {
          // Jika tidak ada, hentikan loading dan tampilkan form login
          setIsCheckingToken(false);
        }
      } catch (e) {
        console.error("Gagal mengecek token:", e);
        setIsCheckingToken(false);
      }
    };

    checkUserToken();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Peringatan", "Email dan password tidak boleh kosong!");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/login", {
        email: email,
        password: password,
      });

      const token = response.data.token;

      // SIMPAN TOKEN KE MEMORI HP (SecureStore)
      await SecureStore.setItemAsync("sadesa_user_token", token);

      // Pindah ke halaman tabs
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Login Gagal",
        "Email atau Password salah, atau server mati.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Tampilan layar putih + spinner saat aplikasi sedang mengecek token
  if (isCheckingToken) {
    return (
      <View style={[styles.container, { alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={{ marginTop: 10, color: "#666" }}>Memuat Sadesa...</Text>
      </View>
    );
  }

  // Tampilan Form Login
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sadesa Mobile</Text>
      <Text style={styles.subtitle}>Sistem Administrasi Desa</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>LOGIN</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007BFF",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
