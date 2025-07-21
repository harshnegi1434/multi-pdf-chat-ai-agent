import React from "react";
import { Box, Avatar } from "@mui/material";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  text: string;
  sender: "user" | "bot";
  dark?: boolean;
  markdown?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender, dark, markdown }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: sender === "user" ? "flex-end" : "flex-start",
      alignItems: "flex-end",
      mb: 1.5,
    }}
  >
    {sender === "bot" && (
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
    )}
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{
        background: sender === "user"
          ? (dark ? "#1976d2" : "#1976d2")
          : (dark ? "rgba(255,255,255,0.08)" : "#e0e0e0"),
        color: sender === "user"
          ? "#fff"
          : (dark ? "#e3f2fd" : "#333"),
        padding: "10px 16px",
        borderRadius: 16,
        maxWidth: "80%",
        fontSize: 15,
        boxShadow: sender === "user" ? "0 2px 8px rgba(25,118,210,0.08)" : "none",
        wordBreak: "break-word",
      }}
    >
      {markdown ? <ReactMarkdown>{text}</ReactMarkdown> : text}
    </motion.div>
  </Box>
);

export default MessageBubble;