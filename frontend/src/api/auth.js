import axios from "axios";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const token = await result.user.getIdToken();

  const api = process.env.REACT_APP_API_URL;

  const { data } = await axios.post(
    `${api}/api/auth/me`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data; // ✅ user z MongoDB
}
