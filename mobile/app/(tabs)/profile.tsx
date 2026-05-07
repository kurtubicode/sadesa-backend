import { router, Link } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
// import { Link } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "@/lib/api";

export default function ProfileScreen() {
  const handleLogout = async () => {
    Alert.alert("Konfirmasi", "Yakin ingin keluar dari Sadesa?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          try {
            // 1. Revoke token di server
            await api.post("/api/logout");
          } catch {
            // Lanjutkan logout lokal meski server tidak bisa dihubungi
          } finally {
            // 2. Hapus token dari SecureStore
            await SecureStore.deleteItemAsync("sadesa_user_token");
            // 3. Kembali ke halaman login
            router.replace("/");
          }
        },
      },
    ]);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil Warga</Text>
      <Text style={styles.subtitle}>Pengaturan Akun & Aplikasi</Text>

      {/* Tombol Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>LOGOUT</Text>
      </TouchableOpacity>
      {/* <Link href="/">
        <Text>logout</Text>
      </Link> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: "#FF3B30", // Warna merah khas untuk tombol bahaya/keluar
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
