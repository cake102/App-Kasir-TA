import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true); // Hindari SSR hydration error

    const currentUser = localStorage.getItem("currentUser"); // Menggunakan localStorage

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(currentUser);
      if (user.role === "Owner") {
        router.replace("/manajemen");
      } else if (user.role === "Staff") {
        router.replace("/transaksi");
      } else {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  if (!hasMounted) return null;

  return null;
}
