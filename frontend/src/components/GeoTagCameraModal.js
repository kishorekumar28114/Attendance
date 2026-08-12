import React, { useRef, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CircularProgress } from "@mui/material";

import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL from "../config";

const GeoTagCameraModal = ({ open, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, token } = useAuth();

  React.useEffect(() => {
    if (open) {
      setCapturedImage(null);
      setLocation(null);
      setError("");
      setLoading(true);
      
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => setError("Camera access denied or not available."))
        .finally(() => setLoading(false));
  
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: pos.timestamp,
          }),
          (err) => setError("Geolocation access denied or not available."),
          { enableHighAccuracy: true }
        );
      } else {
        setError("Geolocation not supported.");
      }
    } else {

      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    }
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(dataUrl);
  };

  const handleSubmit = async () => {
    if (!capturedImage || !location || !user) return;
    setLoading(true);
    setError("");
    try {
  
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append("image", blob, `attendance_${Date.now()}.jpg`);
      formData.append("rollnumber", user.rollnumber);
      formData.append("latitude", location.latitude);
      formData.append("longitude", location.longitude);
      formData.append("timestamp", Date.now());
      const apiUrl = `${API_BASE_URL}/api/attendance/register`;
      const resp = await axios.post(apiUrl, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        },
      });
      onCapture(resp.data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to register attendance. Try again."
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Register Attendance - Geo-tag Camera</DialogTitle>
      <DialogContent>
        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
        {!capturedImage && !error && (
          <div className="flex flex-col items-center">
            <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 8 }} />
            <Button onClick={handleCapture} variant="contained" color="primary" className="mt-4">Capture Photo</Button>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        {capturedImage && (
          <div className="flex flex-col items-center mt-4">
            <img src={capturedImage} alt="Captured" style={{ width: "100%", borderRadius: 8 }} />
            {location && (
              <Typography variant="body2" className="mt-2 text-gray-600">
                Latitude: {location.latitude.toFixed(6)}, Longitude: {location.longitude.toFixed(6)}
              </Typography>
            )}
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleSubmit} color="primary" variant="contained" disabled={!capturedImage || !location}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GeoTagCameraModal;
