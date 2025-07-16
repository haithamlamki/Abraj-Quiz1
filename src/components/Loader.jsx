import loader from "@/assets/loader.svg"
import Image from "next/image"

export default function Loader() {
  return <Image src={loader} alt="Loading spinner" />
}
