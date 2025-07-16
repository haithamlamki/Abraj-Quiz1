import Image from "next/image";
import Button from "@/components/Button";
import background from "@/assets/background.webp";
import { usePlayerContext } from "@/context/player";
import { useSocketContext } from "@/context/socket";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function GameWrapper({ children, textNext, onNext, manager, quizName }) {
  const { socket } = useSocketContext();
  const { player, dispatch } = usePlayerContext();
  const router = useRouter();

  
  
  // Remove all isAr, lang, and Arabic text. Only use English text in UI and messages.
  useEffect(() => {
    socket.on("game:kick", () => {
      dispatch({ type: "LOGOUT" });
      router.replace("/");
    });
    socket.on("game:updateQuestion", () => {
      // SetQuestionState({ current, total }); // Removed as questionState is not used here
    });
    if (manager) {
      // Socket.on("manager:inviteCode", (code) => setInviteCode(code)); // Removed
      // Socket.on("manager:playerCount", (count) => setPlayerCount(count)); // Removed
    }
    return () => {
      socket.off("game:kick");
      socket.off("game:updateQuestion");
      if (manager) {
        socket.off("manager:inviteCode");
        socket.off("manager:playerCount");
      }
    };
  }, [manager, dispatch, router, socket]);

  

  return (
    <section
      className="relative flex min-h-screen w-full flex-col justify-between px-2"
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
      dir="ltr"
    >
      {/* Language toggle - only for players */}
      {/* Removed: No language toggle after entering the quiz */}
      {/* Background */}
      <div className="fixed left-0 top-0 -z-10 h-full w-full bg-[#14181c]">
        <Image
          className="pointer-events-none h-full w-full object-cover opacity-60"
          src={background}
          alt="background"
        />
      </div>
      {/* Header: Logo, Room Info */}
      <div className="flex w-full items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Image src="/abraj-logo.png" width={90} height={90} alt="Abraj Logo" className="mb-2" />
          <span className="text-5xl font-bold text-white tracking-wide">Abraj Quiz</span>
            </div>
        <div className="flex items-center gap-4">
          {quizName && (
            <span className="text-xl font-bold text-white bg-[#04A2C9] px-4 py-2 rounded-lg shadow">{quizName}</span>
          )}
          </div>
      </div>
      {/* Main Content (question, player list, etc.) */}
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        {children}
      </div>
      {/* Footer: Next/Start Button for Manager */}
        {manager && (
        <div className="flex w-full justify-center p-4">
          <Button
            className="main-btn text-xl px-8 py-3"
            onClick={() => onNext()}
          >
            {textNext}
          </Button>
        </div>
        )}
      {/* Player info for non-manager (if needed) */}
      {!manager && (
        <div className="z-50 flex items-center justify-between bg-white px-4 py-2 text-lg font-bold text-white">
          <p className="text-gray-800">{Boolean(player) && player.username}</p>
          <div className="rounded-sm bg-gray-800 px-3 py-1 text-lg">
            {Boolean(player) && player.points}
          </div>
        </div>
      )}
    </section>
  );
}
