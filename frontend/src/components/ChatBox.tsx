import React, { useState } from "react";
import { TextField, Button, Typography, Box, CircularProgress } from "@mui/material";
import MessageBubble from "./MessageBubble";
import axios from "axios";

interface Message {
  user: string;
  bot: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const ChatBox: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("question", question);
      const res = await axios.post(`${API_URL}/ask`, formData);
      setHistory([...history, { user: question, bot: res.data.answer }]);
      setQuestion("");
    } catch (error: any) {
      setHistory([...history, { user: question, bot: "Error: " + (error.response?.data?.detail || error.message) }]);
    }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h6">Ask a Question</Typography>
      <Box sx={{ display: "flex", gap: 2, my: 2 }}>
        <TextField
          label="Type your question..."
          variant="outlined"
          fullWidth
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <Button variant="contained" color="secondary" onClick={handleAsk} disabled={loading || !question.trim()}>
          Ask
        </Button>
      </Box>
      {loading && <CircularProgress sx={{ mb: 2 }} />}
      <Box sx={{ maxHeight: 350, overflowY: "auto", mt: 2 }}>
        {history.map((msg, idx) => (
          <div key={idx}>
            <MessageBubble text={msg.user} sender="user" />
            <MessageBubble text={msg.bot} sender="bot" />
          </div>
        ))}
      </Box>
    </Box>
  );
};

export default ChatBox;