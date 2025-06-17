import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Token tidak ditemukan di header" });
  }

  try {
    const response = await fetch(
      "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/transactions",
      {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Gagal fetch dari API eksternal:", error);
    res.status(500).json({ message: "Terjadi kesalahan internal saat mengambil data" });
  }
}
