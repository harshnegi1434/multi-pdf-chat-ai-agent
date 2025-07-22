import React, { useState, useCallback, useMemo } from "react";
import { TextField, Button, Stack } from "@mui/material";
import { Send } from "@mui/icons-material";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  dark?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = React.memo(({ onSendMessage, disabled, dark }) => {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || disabled) return;
    onSendMessage(inputValue.trim());
    setInputValue("");
  }, [inputValue, disabled, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const textFieldSx = useMemo(() => ({
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      "&:hover": {
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "primary.main",
        },
      },
      "& .MuiOutlinedInput-input": {
        "&::placeholder": {
          opacity: 1,
          color: "text.secondary",
        },
      },
    },
    "& .MuiInputBase-input": {
      color: "text.primary",
    },
  }), []);

  const sendButtonSx = useMemo(() => ({
    borderRadius: 2,
    px: 3,
    minWidth: 60,
    height: 56,
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    "&:hover": {
      background: "linear-gradient(135deg, #5856eb, #6366f1)",
    },
  }), []);

  return (
    <Stack direction="row" spacing={2}>
      <TextField
        fullWidth
        placeholder="Ask about your documents..."
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        size="medium"
        multiline
        maxRows={3}
        sx={textFieldSx}
        InputProps={{
          style: { color: 'inherit' }
        }}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !inputValue.trim()}
        variant="contained"
        sx={sendButtonSx}
      >
        <Send />
      </Button>
    </Stack>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
