// src/services/odoroService.js
import axios from "axios";

const BASE_URL = process.env.ODORO_API_URL || "http://localhost:4000/api/odoro";

export const OdoroService = {
  async getAvailability(date, clinicId) {
    const res = await axios.get(`${BASE_URL}/availability`, { params: { date, clinic_id: clinicId }});
    return res.data;
  },

  async bookAppointment(patient, slotId, reason) {
    const res = await axios.post(`${BASE_URL}/appointments/book`, { patient, slot_id: slotId, reason });
    return res.data;
  },

  async cancelAppointment(appointmentId) {
    const res = await axios.post(`${BASE_URL}/appointments/${appointmentId}/cancel`);
    return res.data;
  },

  async searchPatients(query) {
    const res = await axios.get(`${BASE_URL}/patients`, { params: { query } });
    return res.data.results;
  },
};
