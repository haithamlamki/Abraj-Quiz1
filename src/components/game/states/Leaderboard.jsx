import { useLanguage } from "@/context/language";

export default function Leaderboard({ data: { leaderboard } }) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const texts = {
    leaderboard: isAr ? "الترتيب النهائي" : "Leaderboard",
    points: isAr ? "نقطة" : "pts",
  };
  return (
    <section
      className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-2"
      dir={isAr ? "rtl" : "ltr"}
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
    >
      <h2 className="mb-6 text-5xl font-bold text-white drop-shadow-md">
        {texts.leaderboard}
      </h2>
      <div className="flex w-full flex-col gap-2">
        {Array.isArray(leaderboard) ? leaderboard.map(({ username, points }, key) => (
          <div
            key={key}
            className="flex w-full justify-between rounded-md bg-[#04A2C9] p-3 text-2xl font-bold text-white"
          >
            <span className="drop-shadow-md">{username}</span>
            <span className="drop-shadow-md">{points} {texts.points}</span>
          </div>
        )) : null}
      </div>
    </section>
  );
}
