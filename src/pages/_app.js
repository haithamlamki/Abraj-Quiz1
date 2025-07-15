import Toaster from "@/components/Toaster"
import { PlayerContextProvider } from "@/context/player"
import { SocketContextProvider } from "@/context/socket"
import { LanguageProvider } from "@/context/language";
import "@/styles/globals.css"
import clsx from "clsx"
import { Montserrat, Plaster } from "next/font/google"
import Head from "next/head"

const montserrat = Montserrat({ subsets: ["latin"] })

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="shortcut icon" href="/icon.svg" />
        <title>Abraj Quiz</title>
      </Head>
      <LanguageProvider>
      <SocketContextProvider>
        <PlayerContextProvider>
          <main
            className={clsx(
              "text-base-[8px] flex flex-col",
              montserrat.className,
            )}
          >
            <Component {...pageProps} />
          </main>
        </PlayerContextProvider>
      </SocketContextProvider>
      </LanguageProvider>
      <Toaster />
    </>
  )
}
