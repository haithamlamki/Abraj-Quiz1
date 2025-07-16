import { usePlayerContext } from "@/context/player"
import Form from "@/components/Form"

import Input from "@/components/Input"
import { useEffect, useState } from "react"
import { socket } from "@/context/socket"
import toast from "react-hot-toast";

/**
 * Room join component for entering the room code.
 * @returns {JSX.Element}
 */
export default function Room() {
  const { dispatch } = usePlayerContext()
  const [roomId, setRoomId] = useState("")
  const [error, setError] = useState("")

  const handleLogin = () => {
    socket.emit("player:checkRoom", roomId)
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && roomId.trim()) {
      handleLogin()
    }
  }

  useEffect(() => {
    const onSuccess = (newRoomId) => {
      setError("");
      dispatch({ type: "JOIN", payload: newRoomId });
    };
    const onError = (message) => {
      setError(message);
      toast.error(message);
    };
    socket.on("game:successRoom", onSuccess);
    socket.on("game:errorMessage", onError);
    return () => {
      socket.off("game:successRoom", onSuccess);
      socket.off("game:errorMessage", onError);
    };
  }, [dispatch]);

  const handleInputChange = (e) => {
    setRoomId(e.target.value);
    setError("");
  };

  return (
    <Form>
      <Input
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="PIN Code here"
        className="text-gray-900"
        value={roomId}
      />
      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      <button onClick={handleLogin} disabled={!roomId.trim()} className="main-btn w-full max-w-xs py-3 text-[1.2em] rounded-xl font-bold mt-2">
        Submit
      </button>
    </Form>
  )
}
