import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function LoginScreen() {
  const [email, setEmail] = useState("ahmad@gmail.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const checkUserToken = async () => {
      try {
        // Cek apakah ada token tersimpan di memori HP
        let userToken;
        if (Platform.OS === "web") {
          userToken = localStorage.getItem("sadesa_user_token");
        } else {
          userToken = await SecureStore.getItemAsync("sadesa_user_token");
        }

        if (userToken) {
          // Jika ada token, lewati login dan langsung ke beranda
          router.replace("/home");
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
      // Ingat: pastikan IP ini masih sama dengan IP komputermu saat ini
      const response = await axios.post("http://192.168.1.16:8000/api/login", {
        email: email,
        password: password,
      });
      // http://172.18.50.209:8000/api/login

      const token = response.data.token;

      // SIMPAN TOKEN KE MEMORI HP (SecureStore)
      if (Platform.OS === "web") {
        localStorage.setItem("sadesa_user_token", token);
      } else {
        await SecureStore.setItemAsync("sadesa_user_token", token);
      }

      // Pindah ke halaman tabs
      console.log("✅ Login berhasil!");
      router.replace("/home");
    } catch (error) {
      console.error("❌ Login gagal:", error);
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
