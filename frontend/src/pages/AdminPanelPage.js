import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config";

const API_URL = `${API_BASE_URL}/api/admin/attendance`;

const AdminPanelPage = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ date: "", rollnumber: "", session: "", status: "" });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('present');
  const [editSession, setEditSession] = useState('morning');
  const [editError, setEditError] = useState("");
  const [error, setError] = useState("");

  const fetchRecords = async () => {
    if (!user?.isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(API_URL, {
        params: filters,
        headers: { Authorization: `Bearer ${token}` }
      });
     
      const filtered = (res.data.records || []).filter(r => r.status !== 'failed-location');
      const sorted = filtered.slice().sort((a, b) => b.timestamp - a.timestamp);
      setRecords(sorted);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); /* eslint-disable-next-line */ }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchRecords();
  };

  const handleViewPhoto = (record) => {
    setSelectedPhoto(record.imageUrl);
    setPhotoModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditRecord(record);
    setEditStatus(record.status);
    setEditSession(record.session);
    setEditError("");
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editRecord) return;
    try {
      await axios.patch(
        `${API_BASE_URL}/api/admin/attendance/${editRecord._id}`,
        { status: editStatus, session: editSession },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditModalOpen(false);
      fetchRecords();
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update attendance");
    }
  };


  return (
    <Box className="min-h-screen bg-gray-50 p-6">
      <Box className="flex flex-row justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold">Admin Attendance Panel</Typography>
        <Box className="flex flex-col items-end">
          <Typography variant="body1">{user?.name} ({user?.rollnumber})</Typography>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            style={{ marginTop: 4 }}
            onClick={() => { logout(); navigate('/login'); }}
          >
            Logout
          </Button>
        </Box>
      </Box>
      <Paper className="p-4 mb-6">
        <Box className="flex flex-wrap gap-2 mb-4">
          <TextField label="Date" type="date" name="date" size="small" InputLabelProps={{ shrink: true }} value={filters.date} onChange={handleFilterChange} />
          <TextField label="Student Roll No" name="rollnumber" size="small" value={filters.rollnumber} onChange={handleFilterChange} />
          <TextField label="Session" name="session" size="small" value={filters.session} onChange={handleFilterChange} placeholder="morning/evening" />
          <TextField label="Status" name="status" size="small" value={filters.status} onChange={handleFilterChange} placeholder="present/absent" />
          <Button variant="contained" color="primary" onClick={handleSearch}>Search</Button>
        </Box>
        {error && <Typography color="error" className="mb-2">{error}</Typography>}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell>Roll No</TableCell>
                <TableCell>Room No</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Photo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.session}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.studentId?.name}</TableCell>
                  <TableCell>{row.studentId?.rollnumber}</TableCell>
                  <TableCell>{row.studentId?.roomno}</TableCell>
                  <TableCell>{new Date(row.timestamp).toLocaleTimeString()}</TableCell>
                  <TableCell>
                    {row.imageUrl ? (
                      <Button variant="outlined" size="small" onClick={() => handleViewPhoto(row)}>
                        View Photo
                      </Button>
                    ) : (
                      <Typography variant="caption">No Photo</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" color="secondary" onClick={() => handleEdit(row)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">No records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Dialog open={photoModalOpen} onClose={() => setPhotoModalOpen(false)} maxWidth="md">
        <DialogTitle>Attendance Photo</DialogTitle>
        <DialogContent>
          {selectedPhoto && (
            <img
              src={`${API_BASE_URL}/uploads/${selectedPhoto}`}
              alt="Attendance"
              style={{ maxWidth: "100%", maxHeight: "70vh" }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogTitle>Edit Attendance</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              select
              label="Status"
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="present">present</option>
              <option value="absent">absent</option>
            </TextField>
            <TextField
              select
              label="Session"
              value={editSession}
              onChange={e => setEditSession(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="morning">morning</option>
              <option value="evening">evening</option>
            </TextField>
            {editError && <Typography color="error">{editError}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanelPage;
