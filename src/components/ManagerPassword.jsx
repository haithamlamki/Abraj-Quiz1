import Image from "next/image"
import Form from "@/components/Form"
import Button from "@/components/Button"
import Input from "@/components/Input"
import { useEffect, useState } from "react"
import { socket } from "@/context/socket"
import toast from "react-hot-toast"

/**
 * Manager password entry component.
 * @returns {JSX.Element}
 */
export default function ManagerPassword() {
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleCreate = () => {
    setLoading(true)
    setError("")
    setSuccess("")
    socket.emit("manager:createRoom", password)
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && password.trim()) {
      handleCreate()
    }
  }

  useEffect(() => {
    const onError = (message) => {
      setLoading(false)
      setError(message)
      setSuccess("")
      toast.error(message)
    }
    const onSuccess = (roomInvite) => {
      setLoading(false)
      setError("")
      setSuccess(`Room created! Invite code: ${roomInvite}`)
      toast.success("Room created!")
    }
    socket.on("game:errorMessage", onError)
    socket.on("manager:inviteCode", onSuccess)
    return () => {
      socket.off("game:errorMessage", onError)
      socket.off("manager:inviteCode", onSuccess)
    }
  }, [])

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="absolute h-full w-full overflow-hidden">
        <div className="absolute -left-[15vmin] -top-[15vmin] min-h-[75vmin] min-w-[75vmin] rounded-full bg-primary/15"></div>
        <div className="absolute -bottom-[15vmin] -right-[15vmin] min-h-[75vmin] min-w-[75vmin] rotate-45 bg-primary/15"></div>
      </div>
      <Image src="/abraj-logo.png" width={128} height={128} className="mb-6 h-32" alt="Abraj Logo" />
      <Form>
        <Input
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Manager password"
          className="text-gray-900"
          value={password}
        />
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
        <Button onClick={handleCreate} disabled={!password.trim() || loading}
          className="bg-[#04A2C9] hover:bg-[#0597b3] text-white font-bold py-2 px-4 rounded transition"
        >
          {loading ? "Loading..." : "Submit"}
        </Button>
      </Form>
    </section>
  )
}
