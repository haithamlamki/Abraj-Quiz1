import { usePlayerContext } from "@/context/player"
import Form from "@/components/Form"
import Button from "@/components/Button"
import Input from "@/components/Input"
import { useEffect, useState } from "react"
import { useSocketContext } from "@/context/socket"
import { useRouter } from "next/router"

export default function Username() {
  const { socket } = useSocketContext()
  const { player, dispatch } = usePlayerContext()
  const router = useRouter()
  const [username, setUsername] = useState("")

  const handleJoin = () => {
    socket.emit("player:join", { username: username, room: player.room })
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleJoin()
    }
  }

  useEffect(() => {
    socket.on("game:successJoin", () => {
      dispatch({
        type: "LOGIN",
        payload: username,
      })

      router.replace("/game")
    })

    return () => {
      socket.off("game:successJoin")
    }
  }, [username])

  return (
    <Form>
      <Input
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Username here"
        className="text-gray-900"
        value={username}
      />
      <Button
        onClick={() => handleJoin()}
        className="bg-[#04A2C9] hover:bg-[#0597b3] text-white font-bold py-2 px-4 rounded transition"
      >
        Submit
      </Button>
    </Form>
  )
}
