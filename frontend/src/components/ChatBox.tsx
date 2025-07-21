import React, { useState, useRef, useEffect } from "react";
import { TextField, Button, Typography, Box, Stack, Avatar } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import dayjs from "dayjs";
import Lottie from "lottie-react";
import botAnim from "./bot-thinking.json"; // Download a Lottie JSON bot animation and place here!
import MessageBubble from "./MessageBubble";
import axios from "axios";

interface Message {
  user: string;
  bot: string;
  ts: number;
}

const API_URL = import.meta.env.VITE_API_URL;

const ChatBox: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("question", question);
      const res = await axios.post(`${API_URL}/ask`, formData);
      setHistory([
        ...history,
        { user: question, bot: res.data.answer, ts: Date.now() }
      ]);
      setQuestion("");
    } catch (error: any) {
      setHistory([
        ...history,
        {
          user: question,
          bot: "Error: " + (error.response?.data?.detail || error.message),
          ts: Date.now(),
        },
      ]);
    }
    setLoading(false);
  };

  // Group messages by day for date separator
  const grouped = history.reduce<{ date: string; items: Message[] }[]>((acc, msg) => {
    const date = dayjs(msg.ts).format("YYYY-MM-DD");
    const last = acc[acc.length - 1];
    if (!last || last.date !== date) {
      acc.push({ date, items: [msg] });
    } else {
      last.items.push(msg);
    }
    return acc;
  }, []);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} mb={2}>
        Chat with your PDF
      </Typography>
      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          label="Ask a question about your document..."
          variant="outlined"
          fullWidth
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          size="small"
          sx={{
            borderRadius: 2,
            bgcolor: dark ? "#222" : "#f8fafc",
          }}
          onKeyDown={e => {
            if (e.key === "Enter") handleAsk();
          }}
        />
        <Button
          variant="contained"
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          sx={{ minWidth: 48, borderRadius: 2 }}
        >
          <SendRoundedIcon />
        </Button>
      </Stack>
      <Box
        sx={{
          maxHeight: 320,
          overflowY: "auto",
          bgcolor: dark ? "#222" : "#f8fafc",
          p: 2,
          borderRadius: 2,
          position: "relative",
        }}
      >
        {grouped.map((group, i) => (
          <React.Fragment key={group.date}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                textAlign: "center",
                margin: "8px 0 12px 0",
                fontSize: 13,
                color: "#1976d2",
                fontWeight: 500,
              }}
            >
              {dayjs(group.date).format("MMM D, YYYY")}
            </motion.div>
            {group.items.map((msg, idx) => (
              <React.Fragment key={msg.ts + "-" + idx}>
                <MessageBubble text={msg.user} sender="user" dark={dark} />
                <MessageBubble text={msg.bot} sender="bot" dark={dark} markdown />
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              marginBottom: 12,
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#1976d2",
                width: 32,
                height: 32,
                mr: 1,
                boxShadow: 1,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 54 54" fill="none">
                <ellipse cx="27" cy="32" rx="9" ry="4" fill="#fff" opacity="0.5"/>
                <circle cx="20" cy="27" r="3" fill="#fff"/>
                <circle cx="34" cy="27" r="3" fill="#fff"/>
              </svg>
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Lottie animationData={botAnim} loop style={{ height: 32 }} />
              <Typography variant="caption" color="text.secondary">
                DocuBot is thinking…
              </Typography>
            </Box>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </Box>
    </Box>
  );
};

export default ChatBox;