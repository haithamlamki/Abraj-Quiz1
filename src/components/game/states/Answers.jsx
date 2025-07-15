import AnswerButton from "../../AnswerButton";
import { useSocketContext } from "@/context/socket";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  ANSWERS_COLORS,
  ANSWERS_ICONS,
  SFX_ANSWERS_MUSIC,
  SFX_ANSWERS_SOUND,
  SFX_RESULTS_SOUND,
} from "@/constants";
import useSound from "use-sound";
import { usePlayerContext } from "@/context/player";
import { useLanguage } from "@/context/language";

const calculatePercentages = (objectResponses) => {
  const keys = Object.keys(objectResponses);
  const values = Object.values(objectResponses);
  if (!values.length) return [];
  const totalSum = values.reduce((acc, cur) => acc + cur, 0);
  let result = {};
  keys.map((key) => {
    result[key] = ((objectResponses[key] / totalSum) * 100).toFixed() + "%";
  });
  return result;
};

export default function Answers({
  data: { question, answers, image, time, responses, correct },
}) {
  const { socket } = useSocketContext();
  const { player } = usePlayerContext();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [percentages, setPercentages] = useState([]);
  const [cooldown, setCooldown] = useState(time);
  const [totalAnswer, setTotalAnswer] = useState(0);
  const [sfxPop] = useSound(SFX_ANSWERS_SOUND, { volume: 0.1 });
  const [sfxResults] = useSound(SFX_RESULTS_SOUND, { volume: 0.2 });
  const [playMusic, { stop: stopMusic, isPlaying }] = useSound(
    SFX_ANSWERS_MUSIC,
    { volume: 0.2 }
  );
  const handleAnswer = (answer) => {
    if (!player) return;
    socket.emit("player:selectedAnswer", answer);
    sfxPop();
  };
  useEffect(() => {
    if (!responses) {
      playMusic();
      return;
    }
    stopMusic();
    sfxResults();
    setPercentages(calculatePercentages(responses));
  }, [responses, playMusic, stopMusic]);
  useEffect(() => {
    if (!isPlaying) playMusic();
  }, [isPlaying]);
  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, [playMusic, stopMusic]);
  useEffect(() => {
    socket.on("game:cooldown", (sec) => {
      setCooldown(sec);
    });
    socket.on("game:playerAnswer", (count) => {
      setTotalAnswer(count);
      sfxPop();
    });
    return () => {
      socket.off("game:cooldown");
      socket.off("game:playerAnswer");
    };
  }, [sfxPop, socket]);

  const texts = {
    timer: isAr ? "الوقت" : "Time",
    answers: isAr ? "إجابات" : "Answers",
  };

  return (
    <div
      className="flex h-full flex-1 flex-col justify-between items-center w-full px-2"
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Username always fixed at top center for player only */}
      {/* Removed: Username at top center during quiz */}
      {/* Player name at the top for manager */}
      {player?.isManager && (
      <div className="w-full flex justify-end mb-2">
        <span className="rounded-lg bg-[#04A2C9] px-4 py-2 text-lg font-bold text-white shadow">
          {player?.username}
        </span>
      </div>
      )}
      {/* Question and image */}
      <div className="mx-auto flex flex-col items-center justify-center gap-4 w-full max-w-2xl">
        <h2 className="text-center text-3xl font-bold text-white drop-shadow-lg mb-2">
          {question}
        </h2>
        {!!image && !responses && (
          <img src={image} className="h-40 max-h-52 w-auto rounded-xl shadow-lg" />
        )}
      </div>
      {/* Timer and answer count */}
      {!responses && (
        <div className="mx-auto mb-4 flex w-full max-w-2xl justify-between gap-2 px-2 text-lg font-bold text-white">
          <div className="flex flex-col items-center rounded-full bg-black/40 px-4 text-lg font-bold">
            <span className="translate-y-1 text-sm">{texts.timer}</span>
            <span>{cooldown}</span>
          </div>
          <div className="flex flex-col items-center rounded-full bg-black/40 px-4 text-lg font-bold">
            <span className="translate-y-1 text-sm">{texts.answers}</span>
            <span>{totalAnswer}</span>
          </div>
        </div>
      )}
      {/* Answer buttons - even larger for player only */}
      <div className={`mx-auto mb-4 grid w-full ${!player?.isManager ? 'max-w-3xl grid-cols-1 sm:grid-cols-2 gap-8' : 'max-w-2xl grid-cols-1 sm:grid-cols-2 gap-6'} rounded-xl px-2 text-lg font-bold text-white`}>
        {answers.map((answer, key) => (
          <AnswerButton
            key={key}
            className={clsx(
              !player?.isManager
                ? "rounded-2xl py-16 sm:py-24 text-3xl sm:text-4xl font-bold transition-all duration-150 flex items-center justify-center min-h-[140px] sm:min-h-[200px] shadow-2xl"
                : "rounded-2xl py-6 text-xl font-bold transition-all duration-150 flex items-center justify-center min-h-[64px] sm:min-h-[80px] shadow-lg",
              ANSWERS_COLORS[key],
              {
                "opacity-65": responses && correct !== key,
                "border-4 border-[#04A2C9]": !responses,
              }
            )}
            icon={ANSWERS_ICONS[key]}
            onClick={() => handleAnswer(key)}
            style={!player?.isManager ? { minHeight: 140 } : { minHeight: 64 }}
          >
            {answer}
          </AnswerButton>
        ))}
      </div>
      {/* Show answer stats if responses exist */}
      {responses && (
        <div className="grid w-full max-w-2xl gap-4 grid-cols-2 mt-4">
            {answers.map((_, key) => (
              <div
                key={key}
                className={clsx(
                "flex flex-col justify-end self-end overflow-hidden rounded-xl",
                ANSWERS_COLORS[key]
                )}
                style={{ height: percentages[key] }}
              >
                <span className="w-full bg-black/10 text-center text-lg font-bold text-white drop-shadow-md">
                  {responses[key] || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}
