import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export async function syncMongoUser(idToken) {
  const { data } = await axios.post(
    `${API_URL}/api/auth/me`,
    {},
    { headers: { Authorization: `Bearer ${idToken}` } }
  );
  return data;
}
