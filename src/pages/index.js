import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePlayerContext } from "@/context/player";
import { useSocketContext } from "@/context/socket";
import toast from "react-hot-toast";
import Username from "@/components/game/join/Username";
import dynamic from "next/dynamic";

export default function Home() {
  const { dispatch } = usePlayerContext();
  const { socket } = useSocketContext();
  const [pin, setPin] = useState("");
  const [step, setStep] = useState("PIN");
  const inputRef = useRef();
  const [showScanner, setShowScanner] = useState(false);
  // Dynamically import QRReader to avoid SSR issues
  const QrReader = dynamic(() => import("@blackbox-vision/react-qr-reader").then(mod => mod.QrReader), { ssr: false });

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

  const texts = {
    title: "Abraj Quiz",
    welcome: "Enter the quiz PIN to join",
    pinPlaceholder: "PIN Code",
    join: "Join"
  };

  // Join handler
  const handleJoin = () => {
    if (!pin) {
      return;
    }
    socket.emit("player:checkRoom", pin);
  };

  // Enter key handler
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && pin) {
      handleJoin();
    }
  };

  // QR scan handler
  const handleScan = (result) => {
    if (!result) return;
    const code = result?.text || result;
    // Try to extract PIN from join link or direct code
    const match = code.match(/room=([A-Za-z0-9]+)/);
    if (match) {
      setPin(match[1]);
      setShowScanner(false);
    } else if (/^[A-Za-z0-9]{4,}$/u.test(code)) {
      setPin(code);
      setShowScanner(false);
    }
  };
  const handleError = (error) => {
    toast.error("Failed to read QR code");
    setShowScanner(false);
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
        className="main-btn w-full max-w-xs py-2 mt-3 text-base font-bold flex items-center justify-center gap-2"
        style={{ background: "#fff", color: "#04A2C9", border: "2px solid #04A2C9" }}
        onClick={() => setShowScanner(v => !v)}
      >
        {/* Camera Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="#04A2C9" d="M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm7-7h-2.382l-.724-1.447A2 2 0 0 0 14.382 5h-4.764a2 2 0 0 0-1.512.553L7.382 8H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm0 10H5v-8h2.618l1.447-1.447A1 1 0 0 1 9.618 7h4.764a1 1 0 0 1 .553.553L16.382 10H19v8Z"/></svg>
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
        <button
            className="main-btn w-full py-2 text-base font-bold bg-red-100 text-red-700"
            onClick={() => setShowScanner(false)}
        >
            Close
        </button>
      </div>
      )}
        </>
      ) : (
        <Username />
      )}
    </section>
  );
}
