import { useSocketContext } from "@/context/socket";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

export default function Room({ data: { inviteCode } }) {
  const { socket } = useSocketContext();
  const [playerList, setPlayerList] = useState([]);
  const [qrModal, setQrModal] = useState(false);
  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/join?room=${inviteCode}`;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success("Link copied!");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleNewPlayer = (player) => {
    setPlayerList((prev) => [...prev, player]);
  };

  const handleRemovePlayer = (playerId) => {
    setPlayerList((prev) => prev.filter((p) => p.id !== playerId));
  };

  const handlePlayerKicked = (playerId) => {
    setPlayerList((prev) => prev.filter((p) => p.id !== playerId));
  };

  useEffect(() => {
    socket.on("manager:newPlayer", handleNewPlayer);
    socket.on("manager:removePlayer", handleRemovePlayer);
    socket.on("manager:playerKicked", handlePlayerKicked);

    return () => {
      socket.off("manager:newPlayer", handleNewPlayer);
      socket.off("manager:removePlayer", handleRemovePlayer);
      socket.off("manager:playerKicked", handlePlayerKicked);
    };
  }, [socket]);

  const texts = {
    waiting: "Waiting for players to join",
    playerList: "Connected Players:",
    noPlayers: "No players yet",
    kickTitle: "Click to kick player",
  };

  return (
    <section
      className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-2"
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
      dir="ltr"
    >
      <div className="mb-8 flex flex-col items-center">
        {/* QR above PIN, both centered */}
        <div className="flex flex-col items-center gap-4 mb-4">
          {/* QR Code for joining */}
          {inviteCode && (
            <div className="flex flex-col items-center cursor-pointer" onClick={() => setQrModal(true)} title="Click to enlarge QR code">
              <QRCode value={joinUrl} size={180} />
              <span className="mt-2 text-xs font-bold text-[#04A2C9] text-center">
                Scan QR to join
              </span>
            </div>
          )}
          {/* PIN and Copy Link */}
          <div className="flex flex-col items-center">
            <div className="rounded-xl bg-[#04A2C9] px-8 py-4 text-5xl font-extrabold text-white tracking-widest shadow-lg select-all">
        {inviteCode}
            </div>
            <button className="mt-2 main-btn px-3 py-1 text-sm" onClick={handleCopy}>
              Copy Join Link
            </button>
          </div>
        </div>
        {/* QR Modal */}
        {qrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setQrModal(false)}>
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <QRCode value={joinUrl} size={280} />
              <span className="mt-4 text-lg font-bold text-[#04A2C9] text-center">
                Scan QR code to join from your phone
              </span>
              <button className="mt-4 main-btn px-4 py-2 font-bold" onClick={() => setQrModal(false)}>Close</button>
            </div>
          </div>
        )}
        <h2 className="mb-2 text-3xl font-bold text-white drop-shadow-lg">{texts.waiting}</h2>
      </div>
      <div className="w-full max-w-md rounded-xl bg-[#222c36] p-6 shadow-lg">
        <h3 className="mb-4 text-xl font-bold text-[#04A2C9]">{texts.playerList}</h3>
      <div className="flex flex-wrap gap-3">
          {playerList.length === 0 && (
            <span className="text-white">{texts.noPlayers}</span>
          )}
        {playerList.map((player) => (
          <div
            key={player.id}
              className="shadow-inset rounded-md bg-[#04A2C9] px-4 py-3 font-bold text-white cursor-pointer hover:bg-[#0597b3] transition"
            onClick={() => socket.emit("manager:kickPlayer", player.id)}
              title={texts.kickTitle}
          >
              <span className="text-xl drop-shadow-md hover:line-through">
              {player.username}
            </span>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}
