import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { FaChevronDown, FaUserEdit, FaSignOutAlt } from "react-icons/fa";

const UserProfile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [userData, setUserData] = useState({
    name: "Pengguna",
    email: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const currentUserRaw = localStorage.getItem("currentUser");
        if (!currentUserRaw) return;

        const currentUser = JSON.parse(currentUserRaw);
        const token = currentUser.token;
        const userId = currentUser.id;

        if (!token || !userId) return;

        const res = await fetch(
          `https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/users/${userId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          console.error("Gagal mengambil profil user.");
          return;
        }

        const result = await res.json();
        const profile = result.data;

        setUserData({
          name: profile.name || "Pengguna",
          email: profile.email || "",
        });
      } catch (err) {
        console.error("Error saat fetch profile:", err);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  return (
    <div className="relative flex items-center gap-2 cursor-pointer" ref={dropdownRef}>
      {/* Selamat Datang */}
      <div onClick={() => setIsOpen(!isOpen)}>
        <span className="text-gray-700 font-bold text-xl hidden sm:inline">
          Selamat Datang, {userData.name}
        </span>
      </div>

      {/* Panah Dropdown */}
      <FaChevronDown
        className={`text-gray-500 text-lg transition-transform ${isOpen ? "rotate-180" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      />

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-14 bg-white shadow-lg rounded-xl p-5 w-64 border border-blue-500 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold">{userData.name}</h2>
            <p className="text-sm text-gray-500">{userData.email}</p>
          </div>

          <div className="border-t border-gray-200 my-3"></div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <FaUserEdit className="text-gray-600" />
              Edit Profil
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <FaSignOutAlt className="text-red-500" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;