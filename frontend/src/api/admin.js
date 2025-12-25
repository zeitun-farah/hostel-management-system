import api from "./axios";

export const getAdminDashboard = () => api.get("/admin/dashboard");

export const getAdminHostels = () => api.get("/admin/hostels");

export const getAdminRooms = () => api.get("/admin/rooms");

export const getAdminAllocations = () => api.get("/admin/allocations");

export const createHostel = (data) => api.post("/admin/hostels", data);
export const updateHostel = (id, data) => api.put(`/admin/hostels/${id}`, data);
export const deleteHostel = (id) => api.delete(`/admin/hostels/${id}`);

export const createRoom = (data) => api.post("/admin/rooms", data);
export const updateRoom = (id, data) => api.put(`/admin/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/admin/rooms/${id}`);

// Allocation management (admin)
export const allocateRoomAdmin = (data) =>
  api.post("/admin/allocations/allocate", data);
export const vacateRoomAdmin = (data) =>
  api.post("/admin/allocations/vacate", data);

// Students summary
export const getAdminStudents = () => api.get("/admin/students");

// Payments (admin)
export const getAdminPayments = () => api.get("/payments");
export const confirmPayment = (paymentId) =>
  api.put(`/payments/${paymentId}/confirm`);
export const deletePayment = (paymentId) =>
  api.delete(`/payments/${paymentId}`);
