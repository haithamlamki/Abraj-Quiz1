
import {
  SFX_PODIUM_FIRST,
  SFX_PODIUM_SECOND,
  SFX_PODIUM_THREE,
  SFX_SNEAR_ROOL,
} from "@/constants";
import useScreenSize from "@/hook/useScreenSize";
import clsx from "clsx";
import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";
import useSound from "use-sound";
import Image from "next/image";


import EnhancedReport from "@/components/EnhancedReport";

export default function Podium({ data: { subject, top, leaderboard = [] }, questions = [] }) {
  const [apparition, setApparition] = useState(0);
  const { width, height } = useScreenSize();
  const [sfxtThree] = useSound(SFX_PODIUM_THREE, { volume: 0.2 });
  const [sfxSecond] = useSound(SFX_PODIUM_SECOND, { volume: 0.2 });
  const [sfxRool, { stop: sfxRoolStop }] = useSound(SFX_SNEAR_ROOL, { volume: 0.2 });
  const [sfxFirst] = useSound(SFX_PODIUM_FIRST, { volume: 0.2 });
  
  

  useEffect(() => {
    switch (apparition) {
      case 4:
        sfxRoolStop();
        sfxFirst();
        break;
      case 3:
        sfxRool();
        break;
      case 2:
        sfxSecond();
        break;
      case 1:
        sfxtThree();
        break;
      default: 
        return;
    }
  }, [apparition, sfxFirst, sfxSecond, sfxtThree, sfxRool, sfxRoolStop]);

  useEffect(() => {
    if (top.length < 3) {
      setApparition(4);
      return;
    }
    const interval = setInterval(() => {
      if (apparition > 4) {
        clearInterval(interval);
        return;
      }
      setApparition((value) => value + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [apparition, top.length]);

  const texts = {
    finalResults: "Final Results",
    first: "1st Place",
    second: "2nd Place",
    third: "3rd Place",
    points: "pts",
    congrats: "Congratulations to the winners!",
  };

  

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center w-full"
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
      dir="ltr"
    >
      {/* Confetti Animation */}
      {apparition >= 4 && (
        <ReactConfetti width={width} height={height} className="h-full w-full z-10" />
      )}
      {/* Logo and Title */}
      <div className="flex flex-col items-center mb-6 mt-8">
        <Image src="/abraj-logo.png" width={90} height={90} alt="Abraj Logo" className="mb-2" />
        <h2 className="text-center text-4xl font-bold text-[#04A2C9] drop-shadow-lg mb-2">{texts.finalResults}</h2>
        <p className="text-white text-xl font-bold mb-2">{subject}</p>
      </div>
      {/* Podium */}
      <div className="relative w-full max-w-3xl flex items-end justify-center gap-8 z-20">
        {/* 3rd Place - left */}
        {top[2] && (
          <div
            className={clsx(
              "flex flex-col items-center justify-end gap-2 transition-all",
              apparition >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}
            style={{ minWidth: 220, height: 320 }} /* Increased size */
          >
            <div className="bg-[#037a91] rounded-t-2xl rounded-b-lg shadow-lg px-12 py-12 flex flex-col items-center" style={{ height: 220 }}>
              <span className="text-7xl font-bold text-white mb-4">🥉</span>
              <span className="text-4xl font-bold text-white mb-2">{top[2].username}</span>
              <span className="text-3xl font-bold text-white">{top[2].points} {texts.points}</span>
            </div>
            <span className="text-3xl font-bold text-[#04A2C9]">{texts.third}</span>
          </div>
        )}
        {/* 1st Place - center */}
        {top[0] && (
          <div
            className={clsx(
              "flex flex-col items-center justify-end gap-2 transition-all",
              apparition >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}
            style={{ minWidth: 280, height: 420 }} /* Increased size */
          >
            <div className="bg-[#04A2C9] rounded-t-2xl rounded-b-lg shadow-2xl px-16 py-16 flex flex-col items-center border-4 border-yellow-300" style={{ height: 320 }}>
              <span className="text-9xl font-bold text-yellow-300 mb-6">🏆</span>
              <span className="text-5xl font-bold text-white mb-3">{top[0].username}</span>
              <span className="text-4xl font-bold text-white">{top[0].points} {texts.points}</span>
            </div>
            <span className="text-4xl font-bold text-yellow-300">{texts.first}</span>
          </div>
        )}
        {/* 2nd Place - right */}
        {top[1] && (
          <div
            className={clsx(
              "flex flex-col items-center justify-end gap-2 transition-all",
              apparition >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}
            style={{ minWidth: 220, height: 360 }} /* Increased size */
          >
            <div className="bg-[#0597b3] rounded-t-2xl rounded-b-lg shadow-lg px-12 py-14 flex flex-col items-center" style={{ height: 260 }}>
              <span className="text-7xl font-bold text-white mb-4">🥈</span>
              <span className="text-4xl font-bold text-white mb-2">{top[1].username}</span>
              <span className="text-3xl font-bold text-white">{top[1].points} {texts.points}</span>
            </div>
            <span className="text-3xl font-bold text-[#04A2C9]">{texts.second}</span>
          </div>
        )}
      </div>
      {/* Celebration text and Return button */}
      {apparition >= 4 && (
        <>
          {/* PDF Report Button for Manager */}
          {typeof window !== 'undefined' && localStorage.getItem('isManager') === 'true' && (
            <EnhancedReport
              testInfo={{
                title: subject,
                date: new Date(),
                duration: `${questions?.length || 0} questions`,
              }}
              questions={Array.isArray(questions) ? questions.map(q => ({
                question: q?.question,
                answers: q?.answers,
                correctAnswer: q?.answers?.[q?.correct]
              })) : []}
              results={Array.isArray(leaderboard) ? leaderboard.map(p => ({
                playerName: p?.username,
                score: p?.points
              })) : []}
              logoUrl="/abraj-logo.png"
            />
          )}
          <div className="mt-10 text-3xl font-bold text-yellow-300 drop-shadow-lg animate-bounce">{texts.congrats}</div>
          {/* Full leaderboard */}
          <div className="mt-8 w-full max-w-2xl bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-[#04A2C9] mb-4 text-center">Leaderboard</h3>
            <div className="flex flex-col gap-2">
              {leaderboard.length > 0 ? leaderboard.map((player, idx) => (
                <div key={player.username + idx} className="flex justify-between items-center px-4 py-2 border-b last:border-b-0">
                  <span className="font-bold text-lg text-gray-800">{idx + 1}. {player.username}</span>
                  <span className="font-bold text-lg text-[#04A2C9]">{player.points} {texts.points}</span>
                </div>
              )) : <div className="text-gray-500 text-center">No players</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
