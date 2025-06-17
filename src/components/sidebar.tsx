import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { FC } from "react";

interface MenuItem {
  name: string;
  iconPath: string;
  path: string;
  allowedRoles: string[];
}

const Sidebar: FC = () => {
  const router = useRouter();
  const [active, setActive] = useState<string>(router.pathname);
  const [isHovered, setIsHovered] = useState(false);
  const [role, setRole] = useState<string | null>(null); 

  useEffect(() => {
    setActive(router.pathname);
  }, [router.pathname]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentUser = localStorage.getItem("currentUser");
      if (currentUser) {
        try {
          const parsed = JSON.parse(currentUser);
          setRole(parsed?.role || null);
        } catch (e) {
          console.error("Error parsing localStorage:", e);
        }
      }
    }
  }, []);

  const menuItems: MenuItem[] = [
    { name: "Manajemen", iconPath: "/icons/manajemen.svg", path: "/manajemen", allowedRoles: ["Owner"] },
    { name: "Transaksi", iconPath: "/icons/transaksi.svg", path: "/transaksi", allowedRoles: ["Staff"] },
    { name: "Laporan", iconPath: "/icons/laporan.svg", path: "/laporan", allowedRoles: ["Owner"] },
    { name: "Akun Saya", iconPath: "/icons/akun.svg", path: "/profile", allowedRoles: ["Owner", "Staff"] },
  ];

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  
  if (role === null) return <div>Loading...</div>;  

  return (
    <div className="relative">
      {isHovered && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-30 transition-opacity duration-300"
          onMouseEnter={() => setIsHovered(false)}
        ></div>
      )}

      <div
        className={`h-screen bg-white shadow-md flex flex-col items-center py-5 font-poppins transition-all duration-300 relative z-10 ${
          isHovered ? "w-64" : "w-20"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col items-center justify-center">
          <Image src="/logo.svg" alt="Kasir" width={40} height={40} />
          {isHovered && <span className="text-gray-600 text-sm font-semibold mt-2">Toko Aya</span>}
        </div>

        <div className="w-full px-4 mt-6 flex items-center justify-center">
          <span className={`text-gray-500 text-sl uppercase ${isHovered ? "text-sm" : "text-[13px]"}`}>
            MAIN
          </span>
        </div>

        <nav className="flex flex-col items-center justify-center flex-grow gap-6 w-full">
          {menuItems
            .filter(item => item.allowedRoles.includes(role))
            .map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center justify-center w-full py-3 px-4 transition-all text-gray-500"
              >
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-xl ${
                    active.startsWith(item.path) ? "bg-blue-200" : ""
                  }`}
                >
                  <Image src={item.iconPath} alt={item.name} width={24} height={24} />
                </div>
                {isHovered && <span className="text-xs text-center">{item.name}</span>}
              </button>
            ))}
        </nav>

        <div className="w-full flex justify-center">
          <div className="w-3/4 border-t border-gray-300 my-2"></div>
        </div>

        <div className="mt-auto flex flex-col items-center w-full pb-6">
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center w-full py-3 px-4 transition-all text-gray-500"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-200">
              <Image src="/icons/logout.svg" alt="Keluar" width={24} height={24} />
            </div>
            {isHovered && <span className="text-xs">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
