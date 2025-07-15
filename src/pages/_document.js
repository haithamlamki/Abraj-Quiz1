import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>
      <body className="bg-secondary">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
