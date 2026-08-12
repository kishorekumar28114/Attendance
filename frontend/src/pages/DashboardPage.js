import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Snackbar, Alert } from "@mui/material";
import { FaHistory, FaCamera } from "react-icons/fa";
import GeoTagCameraModal from "../components/GeoTagCameraModal";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import API_BASE_URL from "../config";

const DashboardPage = () => {
  const { user, token, logout } = useAuth();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });


  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/attendance/history?rollnumber=${user.rollnumber}`;
      if (date) url += `&date=${date}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data.history || []);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message === "User not found") {
        logout();
        setSnackbar({ open: true, message: "Session expired. Please log in again.", severity: "error" });
      } else {
        setSnackbar({ open: true, message: "Failed to load history", severity: "error" });
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, [user, date]);

  const handleCapture = (result) => {
    setSnackbar({ open: true, message: result.message, severity: "success" });
    fetchHistory();
  };

 
  if (user?.isAdmin) {
    window.location.replace('/admin');
    return null;
  }

  return (
    <Box className="min-h-screen bg-gray-50 p-6">
      <Box className="flex flex-row justify-between items-center mb-4">
        <Typography variant="h4" className="font-bold">Attendance Dashboard</Typography>
        <Box className="flex flex-col items-end">
          <Typography variant="body1">{user?.name} ({user?.rollnumber})</Typography>
          {user?.isAdmin && (
            <Button
              variant="contained"
              color="info"
              size="small"
              href="/admin"
              style={{ marginTop: 4, marginBottom: 4 }}
            >
              Admin Panel
            </Button>
          )}
          <Button variant="outlined" color="secondary" size="small" onClick={logout} style={{ marginTop: 4 }}>Logout</Button>
        </Box>
      </Box>
      <Paper className="p-4 mb-6">
        <Box className="flex items-center mb-4">
          <FaHistory className="mr-2 text-blue-600" />
          <Typography variant="h6">Attendance History</Typography>
        </Box>
        <Box className="mb-4 flex flex-row items-center gap-2">
          <TextField
            label="Filter by Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={e => setDate(e.target.value)}
            size="small"
          />
          <Button onClick={() => setDate("")}>Clear</Button>
        </Box>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Latitude</TableCell>
                <TableCell>Longitude</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.session}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{new Date(row.timestamp).toLocaleTimeString()}</TableCell>
                  <TableCell>{row.latitude?.toFixed(5)}</TableCell>
                  <TableCell>{row.longitude?.toFixed(5)}</TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No attendance records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Box className="flex justify-center">
        <Button
          variant="contained"
          color="primary"
          startIcon={<FaCamera />}
          onClick={() => setCameraOpen(true)}
        >
          Register Attendance
        </Button>
      </Box>
      <GeoTagCameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCapture}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DashboardPage;
