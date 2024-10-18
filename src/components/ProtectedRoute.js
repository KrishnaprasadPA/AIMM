// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const loggedUser = localStorage.getItem('loggedUser');

  if (!isLoggedIn && !loggedUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;