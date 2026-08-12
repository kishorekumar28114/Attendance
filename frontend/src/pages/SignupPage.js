import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import { FaUserPlus } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL from "../config";

const SignupPage = () => {
  const [form, setForm] = useState({
    name: "",
    rollnumber: "",
    email: "",
    phone: "",
    roomno: "",
    password: ""
  });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };


  return (
    <Box className="flex min-h-screen items-center justify-center bg-gray-100">
      <Paper elevation={3} className="p-8 max-w-sm w-full">
        <Box className="flex flex-col items-center mb-6">
          <FaUserPlus size={36} className="text-green-600 mb-2" />
          <Typography variant="h5" className="mb-2 font-bold">Sign Up</Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <TextField label="Name" name="name" variant="outlined" fullWidth margin="normal" required value={form.name} onChange={handleChange} />
          <TextField label="Roll Number" name="rollnumber" variant="outlined" fullWidth margin="normal" required value={form.rollnumber} onChange={handleChange} />
          <TextField label="Email" name="email" variant="outlined" fullWidth margin="normal" required value={form.email} onChange={handleChange} />
          <TextField label="Phone" name="phone" variant="outlined" fullWidth margin="normal" required value={form.phone} onChange={handleChange} />
          <TextField
            label="Room No"
            name="roomno"
            value={form.roomno}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField label="Password" name="password" variant="outlined" type="password" fullWidth margin="normal" required value={form.password} onChange={handleChange} />
          {error && <Typography color="error" className="mt-2">{error}</Typography>}
          <Button variant="contained" color="primary" fullWidth className="mt-4" type="submit">Sign Up</Button>
        </form>
        <Typography variant="body2" className="mt-4 text-center">
          Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default SignupPage;
