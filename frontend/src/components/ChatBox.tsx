import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { TextField, Button, Typography, Box, Stack, Avatar, Paper, Chip } from "@mui/material";
import { Send, SmartToy, Person } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import Lottie from "lottie-react";
import botAnim from "./bot-thinking.json";
import ChatInput from "./ChatInput";
import axios from "axios";

interface Message {
  user: string;
  bot: string;
  ts: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ChatBox: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history.length, loading, scrollToBottom]);

  const handleSendMessage = useCallback(async (question: string) => {
    const newMessage: Message = { 
      user: question, 
      bot: "", 
      ts: Date.now() 
    };
    
    // Add user message immediately
    setHistory(prev => [...prev, newMessage]);
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("question", question);
      const res = await axios.post(`${API_URL}/ask`, formData);
      
      // Update the message with bot response
      setHistory(prev => 
        prev.map(msg => 
          msg.ts === newMessage.ts 
            ? { ...msg, bot: res.data.answer }
            : msg
        )
      );
    } catch (error: any) {
      // Update the message with error response
      setHistory(prev => 
        prev.map(msg => 
          msg.ts === newMessage.ts 
            ? { ...msg, bot: "Error: " + (error.response?.data?.detail || error.message) }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const MessageBubble = React.memo(({ text, isUser, markdown = false }: { text: string; isUser: boolean; markdown?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      key={`${text}-${isUser}`}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          justifyContent: isUser ? "flex-end" : "flex-start",
        }}
      >
        {!isUser && (
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 32,
              height: 32,
              order: isUser ? 1 : 0,
            }}
          >
            <SmartToy sx={{ fontSize: 18 }} />
          </Avatar>
        )}
        <Paper
          elevation={0}
          sx={{
            px: 3,
            py: 2,
            maxWidth: "75%",
            bgcolor: isUser ? "primary.main" : (dark ? "grey.800" : "grey.100"),
            color: isUser ? "white" : "text.primary",
            border: isUser ? "none" : 1,
            borderColor: "divider",
            textAlign: "left",
            "& p": { 
              margin: 0,
              textAlign: "left",
            },
            "& pre": {
              bgcolor: dark ? "grey.900" : "grey.50",
              p: 1,
              borderRadius: 1,
              overflow: "auto",
              textAlign: "left",
            },
            "& code": {
              bgcolor: dark ? "grey.900" : "grey.50",
              px: 0.5,
              py: 0.25,
              borderRadius: 0.5,
              fontSize: "0.875rem",
            },
            "& ul, & ol": {
              textAlign: "left",
              paddingLeft: 2,
            },
            "& li": {
              textAlign: "left",
            },
          }}
        >
          {markdown ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <Typography variant="body2" sx={{ textAlign: "left", mb: 1 }}>
                    {children}
                  </Typography>
                ),
                strong: ({ children }) => (
                  <Typography component="strong" sx={{ fontWeight: 600 }}>
                    {children}
                  </Typography>
                ),
                ul: ({ children }) => (
                  <Box component="ul" sx={{ textAlign: "left", pl: 2, my: 1 }}>
                    {children}
                  </Box>
                ),
                ol: ({ children }) => (
                  <Box component="ol" sx={{ textAlign: "left", pl: 2, my: 1 }}>
                    {children}
                  </Box>
                ),
                li: ({ children }) => (
                  <Typography component="li" variant="body2" sx={{ textAlign: "left", mb: 0.5 }}>
                    {children}
                  </Typography>
                ),
              }}
            >
              {text}
            </ReactMarkdown>
          ) : (
            <Typography variant="body2" sx={{ textAlign: "left" }}>
              {text}
            </Typography>
          )}
        </Paper>
        {isUser && (
          <Avatar
            sx={{
              bgcolor: "grey.400",
              width: 32,
              height: 32,
            }}
          >
            <Person sx={{ fontSize: 18 }} />
          </Avatar>
        )}
      </Box>
    </motion.div>
  ));

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Chat Assistant
        </Typography>
        <Chip 
          label={`${history.length} message${history.length !== 1 ? 's' : ''}`}
          size="small" 
          variant="outlined"
          sx={{ borderRadius: 1, fontSize: "0.75rem" }}
        />
      </Box>

      {/* Chat Messages - Takes remaining space */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          mb: 2,
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: dark ? "grey.900" : "grey.50",
          minHeight: 300,
        }}
      >
        {history.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <SmartToy sx={{ fontSize: 48, color: "primary.main", mb: 2, opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              Ask me anything about your uploaded documents
            </Typography>
          </Box>
        ) : (
          <>
            {history.map((msg, idx) => (
              <React.Fragment key={`${idx}-${msg.ts}`}>
                <MessageBubble text={msg.user} isUser />
                {msg.bot ? (
                  <MessageBubble text={msg.bot} isUser={false} markdown />
                ) : loading && idx === history.length - 1 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                      <Avatar
                        sx={{
                          bgcolor: "primary.main",
                          width: 32,
                          height: 32,
                        }}
                      >
                        <SmartToy sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Paper
                        elevation={0}
                        sx={{
                          px: 2,
                          py: 1.5,
                          borderRadius: 2,
                          border: 1,
                          borderColor: "divider",
                          bgcolor: dark ? "grey.800" : "grey.100",
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <Lottie animationData={botAnim} loop style={{ height: 20, width: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          Thinking...
                        </Typography>
                      </Paper>
                    </Box>
                  </motion.div>
                ) : null}
              </React.Fragment>
            ))}
          </>
        )}

        {/* Loading Animation - only when no pending message */}
        <AnimatePresence>
          {loading && history.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: 32,
                    height: 32,
                  }}
                >
                  <SmartToy sx={{ fontSize: 18 }} />
                </Avatar>
                <Paper
                  elevation={0}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: dark ? "grey.800" : "grey.100",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Lottie animationData={botAnim} loop style={{ height: 20, width: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    Thinking...
                  </Typography>
                </Paper>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </Paper>

      {/* Input - Fixed at bottom */}
      <ChatInput 
        onSendMessage={handleSendMessage}
        disabled={loading}
        dark={dark}
      />
    </Box>
  );
};

export default React.memo(ChatBox);