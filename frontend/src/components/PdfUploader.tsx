import React, { useState, ChangeEvent } from "react";
import { Button, Typography, LinearProgress } from "@mui/material";
import axios from "axios";

interface PdfUploaderProps {
  onSuccess: () => void;
}

const API_URL = import.meta.env.VITE_API_URL;

const PdfUploader: React.FC<PdfUploaderProps> = ({ onSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setLoading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    try {
      await axios.post(`${API_URL}/upload_pdfs`, formData);
      onSuccess();
    } catch (error: any) {
      alert("Upload failed! " + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  return (
    <>
      <Typography variant="h6">Upload your PDF Files</Typography>
      <input type="file" multiple accept="application/pdf" onChange={handleFileChange} style={{ margin: "16px 0" }} />
      <Button variant="contained" color="primary" onClick={handleUpload} disabled={loading || !files.length}>
        Submit & Process
      </Button>
      {loading && <LinearProgress sx={{ mt: 2 }} />}
    </>
  );
};

export default PdfUploader;