import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import { FaUser } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL from "../config";

const LoginPage = () => {
  const [rollnumber, setRollnumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollnumber, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      login(data.user, data.token);
      if (data.user.isAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    }
  };


  return (
    <Box className="flex min-h-screen items-center justify-center bg-gray-100">
      <Paper elevation={3} className="p-8 max-w-sm w-full">
        <Box className="flex flex-col items-center mb-6">
          <FaUser size={36} className="text-blue-600 mb-2" />
          <Typography variant="h5" className="mb-2 font-bold">Login</Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <TextField label="Roll Number" variant="outlined" fullWidth margin="normal" required value={rollnumber} onChange={e => setRollnumber(e.target.value)} />
          <TextField label="Password" variant="outlined" type="password" fullWidth margin="normal" required value={password} onChange={e => setPassword(e.target.value)} />
          {error && <Typography color="error" className="mt-2">{error}</Typography>}
          <Button variant="contained" color="primary" fullWidth className="mt-4" type="submit">Login</Button>
        </form>
        <Typography variant="body2" className="mt-4 text-center">
          Don&apos;t have an account? <Link to="/signup" className="text-blue-600">Sign up</Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;
