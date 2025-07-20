import React from "react";
import { Box } from "@mui/material";

interface MessageBubbleProps {
  text: string;
  sender: "user" | "bot";
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender }) => (
  <Box
    sx={{
      bgcolor: sender === "user" ? "#1976d2" : "#e0e0e0",
      color: sender === "user" ? "#fff" : "#000",
      p: 2,
      borderRadius: 2,
      mb: 1,
      maxWidth: "80%",
      ml: sender === "user" ? "auto" : 0,
      mr: sender === "bot" ? "auto" : 0,
    }}
  >
    {text}
  </Box>
);

export default MessageBubble;