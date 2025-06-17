import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { FaTimes } from "react-icons/fa";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [daftarKamera, setDaftarKamera] = useState<MediaDeviceInfo[]>([]);
  const [kameraTerpilih, setKameraTerpilih] = useState<string>("");
  const [isScanning, setIsScanning] = useState(true);
  const lastScannedCodeRef = useRef<string | null>(null);
  
  // Pengecekan untuk memastikan Audio hanya digunakan di sisi klien
  const beepSound = useRef<HTMLAudioElement | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState("");

  const stableOnScan = useCallback((barcode: string) => {
    onScan(barcode);
  }, [onScan]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then((devices) => {
        const kameraVideo = devices.filter((device) => device.kind === "videoinput");
        setDaftarKamera(kameraVideo);
        if (kameraVideo.length > 0) {
          setKameraTerpilih(kameraVideo[0].deviceId);
        }
      })
      .catch(() => alert("Gagal mendapatkan daftar kamera. Coba berikan izin kamera."));
  }, []);

  useEffect(() => {
    if (!scannerRef.current || !kameraTerpilih || !isScanning) return;

    const qrCodeScanner = new Html5Qrcode("scanner-container", {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.UPC_A
      ]
    });

    qrCodeScanner
      .start(
        kameraTerpilih,
        {
          fps: 15,
          qrbox: { width: 250, height: 200 }
        },
        (decodedText) => {
          if (decodedText === lastScannedCodeRef.current) return;
          
          // Pastikan audio hanya dimainkan di sisi klien
          if (typeof window !== "undefined") {
            beepSound.current = new Audio("/beep.mp3")
          }

          lastScannedCodeRef.current = decodedText;
          stableOnScan(decodedText);
          setScannedBarcode(decodedText);
          setTimeout(() => (lastScannedCodeRef.current = null), 2000);
        },
        () => {}
      )
      .catch(() => alert("Gagal memulai scanner. Coba ganti kamera."));

    // Cleanup harus sinkron
    return () => {
      qrCodeScanner.stop().then(() => {
        qrCodeScanner.clear();
      }).catch(console.error);
    };
  }, [kameraTerpilih, isScanning, stableOnScan]);

  useEffect(() => {
    let barcodeBuffer = "";
    let timeout: NodeJS.Timeout;

    const handleKeydown = (event: KeyboardEvent) => {
      const key = event.key;

      if (/^[a-zA-Z0-9]$/.test(key)) {
        barcodeBuffer += key;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        if (barcodeBuffer.length > 3) {
          barcodeBuffer = barcodeBuffer.trim();
          // Pastikan audio hanya dimainkan di sisi klien
          if (typeof window !== "undefined" && beepSound.current) {
            beepSound.current.play().catch(console.error);
          }

          stableOnScan(barcodeBuffer);
          setScannedBarcode(barcodeBuffer);
          barcodeBuffer = "";
        }
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        barcodeBuffer = "";
      }, 500);
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [stableOnScan]);

  useEffect(() => {
    const interval = setInterval(() => {
      const video = scannerRef.current?.querySelector("video");
      if (video) {
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "cover";
        video.style.borderRadius = "0.375rem";
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setIsScanning(false);
    onClose();
  };

  return (
    isScanning && (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
        <div
          className="bg-white p-4 rounded-lg shadow-lg w-full max-w-xs flex flex-col justify-center relative"
          style={{ maxHeight: "90vh", overflow: "hidden" }}
        >
          <button className="absolute top-2 right-2 text-gray-600 hover:text-gray-800" onClick={handleClose}>
            <FaTimes className="text-lg" />
          </button>
          <h2 className="text-lg font-semibold mb-2 text-center">Pindai Barcode</h2>
          <p className="text-center text-sm">Gunakan scanner USB atau kamera</p>

          <div className="mb-2">
            <label className="text-sm font-medium block">Pilih Kamera</label>
            <select
              value={kameraTerpilih}
              onChange={(e) => setKameraTerpilih(e.target.value)}
              className="w-full p-1 border rounded-md"
            >
              {daftarKamera.map((kamera, index) => (
                <option key={index} value={kamera.deviceId}>
                  {kamera.label || `Kamera ${index + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div
            id="scanner-container"
            ref={scannerRef}
            style={{
              width: "100%",
              height: "200px",
              backgroundColor: "black",
              borderRadius: "0.375rem",
              position: "relative",
              overflow: "hidden"
            }}
          ></div>

          {scannedBarcode && (
            <div className="mt-4 p-2 bg-green-100 border border-green-400 text-center font-bold text-green-600">
              {scannedBarcode}
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default BarcodeScanner;