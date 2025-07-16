import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePlayerContext } from "@/context/player";
import { useSocketContext } from "@/context/socket";
import toast from "react-hot-toast";
import Username from "@/components/game/join/Username";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

export default function Join() {
  const { dispatch } = usePlayerContext();
  const { socket } = useSocketContext();
  const [pin, setPin] = useState("");
  const [step, setStep] = useState("PIN");
  const inputRef = useRef();
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  // Dynamically import QRReader to avoid SSR issues
  const QrReader = dynamic(() => import("@blackbox-vision/react-qr-reader").then(mod => mod.QrReader), { ssr: false });

  // Auto-fill PIN from URL
  useEffect(() => {
    if (router.query.room && typeof router.query.room === "string") {
      setPin(router.query.room);
    }
  }, [router.query.room]);

  useEffect(() => {
    const onSuccessRoom = (roomId) => {
      dispatch({ type: "JOIN", payload: roomId });
      setStep("USERNAME");
    };
    socket.on("game:successRoom", onSuccessRoom);
    socket.on("game:errorMessage", (message) => {
      toast.error(message);
    });
    return () => {
      socket.off("game:successRoom", onSuccessRoom);
      socket.off("game:errorMessage");
    };
  }, [socket, dispatch]);

  // Handle QR scan result
  const handleScan = (result) => {
    if (!result) {
      return;
    }
    const code = result?.text || result;
    // Try to extract PIN from join link or direct code
    const match = code.match(/room=([A-Za-z0-9]+)/u);
    if (match) {
      setPin(match[1]);
      setShowScanner(false);
    } else if (/^[A-Za-z0-9]{4,}$/u.test(code)) {
      setPin(code);
      setShowScanner(false);
    }
  };

  const texts = {
    title: "Abraj Quiz",
    welcome: "Enter the quiz PIN to join",
    pinPlaceholder: "PIN Code",
    join: "Join"
  };

  // Join handler
  const handleJoin = () => {
    if (!pin) return;
    socket.emit("player:checkRoom", pin);
  };

  // Enter key handler
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && pin) {
      handleJoin();
    }
  };

  return (
    <section
      className="relative flex min-h-screen flex-col items-center justify-center px-4"
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
      dir="ltr"
    >
      <div className="absolute h-full w-full overflow-hidden pointer-events-none">
        <div className="absolute -left-[15vmin] -top-[15vmin] min-h-[75vmin] min-w-[75vmin] rounded-full bg-[#04A2C9]/15"></div>
        <div className="absolute -bottom-[15vmin] -right-[15vmin] min-h-[75vmin] min-w-[75vmin] rotate-45 bg-[#04A2C9]/15"></div>
      </div>
      <Image src="/abraj-logo.png" width={180} height={180} alt="Abraj Logo" className="mb-6" />
      <h1 className="text-[48px] font-bold mb-2" style={{ color: "#04A2C9" }}>{texts.title}</h1>
      <p className="text-white mb-8 text-[22px]">{texts.welcome}</p>
      {step === "PIN" ? (
        <>
          <input
            ref={inputRef}
            type="text"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={texts.pinPlaceholder}
            className="mb-4 px-6 py-4 text-[20px] rounded-lg border-2 border-[#04A2C9] focus:outline-none focus:ring-2 focus:ring-[#04A2C9] w-full max-w-xs text-center"
            style={{ direction: "ltr", color: "#222", background: "#fff" }}
          />
          <button
            className="main-btn w-full max-w-xs py-3 text-[1.2em] rounded-xl font-bold"
            style={{ background: "linear-gradient(90deg, #04A2C9 60%, #0597b3 100%)", color: "#fff" }}
            onClick={handleJoin}
            disabled={!pin}
          >
            {texts.join}
          </button>
          {/* QR Scanner Toggle */}
          <button
            className="main-btn w-full max-w-xs py-2 mt-3 text-base font-bold"
            style={{ background: "#fff", color: "#04A2C9", border: "2px solid #04A2C9" }}
            onClick={() => setShowScanner(v => !v)}
          >
            {showScanner ? "Hide Scanner" : "Scan QR Code"}
          </button>
          {/* QR Scanner */}
          {showScanner && (
            <div className="w-full max-w-xs mt-3 rounded-lg overflow-hidden border-2 border-[#04A2C9] bg-white">
              <QrReader
                constraints={{ facingMode: "environment" }}
                onResult={handleScan}
                onError={handleError}
                style={{ width: "100%" }}
              />
              <div className="text-center text-xs text-gray-700 py-2">
                {"Point your camera at a QR code to join instantly"}
              </div>
            </div>
          )}
        </>
      ) : (
        <Username />
      )}
      {/* Remove language toggle button */}
    </section>
  );
} 