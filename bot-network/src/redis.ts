require("dotenv").config();
import { createClient } from "redis";



const client = createClient({
  url: "redis://default:FNLq3uZM9IIj0ejRJGlDxX4S1WliHs0zF506enAWNLCpcDChkbSx3GDUIs@161.35.179.211:6379",
});

(async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log("[Redis] Client Connected Successfully");
    }
  } catch (err) {
    console.error("[Redis] Connection Error:", err);
  }
})();

export default client;
