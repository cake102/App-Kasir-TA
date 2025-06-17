import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

const Login = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result?.meta?.message || "Login gagal");
        return;
      }

      const userData = result.data;

      let role = "Staff"; // default role
      if (userData.username === "admin" || userData.username === "johndoe") {
        role = "Owner";
      }

      const currentUser = {
        ...userData,
        role,
      };

      // Simpan ke localStorage (jika memang masih ingin dipakai, atau bisa dihapus jika tidak perlu sama sekali)
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      localStorage.setItem("token", userData.token);

      // Arahkan ke halaman sesuai role
      if (role === "Owner") {
        router.push("/manajemen");
      } else {
        router.push("/transaksi");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Terjadi kesalahan saat login");
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col">
      <div className="p-6 absolute top-0 left-0 flex items-center gap-2">
        <Image src="/icons/icon.svg" alt="Logo" width={150} height={100} />
      </div>

      <div className="h-full flex items-center justify-center">
        <div className="flex w-full max-w-5xl">
          <div className="w-1/2 flex items-center justify-center">
            <Image src="/icons/gambar.svg" alt="Login" width={350} height={350} />
          </div>

          <div className="w-1/2 px-12 flex flex-col justify-center">
            <h2 className="text-2xl font-bold">Masuk ke Akun Anda</h2>
            <p className="text-gray-500 text-sm">Kamu dapat masuk sebagai owner ataupun staf</p>

            <form onSubmit={handleLogin} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full p-3 border rounded-lg bg-gray-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full p-3 border rounded-lg bg-gray-100"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
