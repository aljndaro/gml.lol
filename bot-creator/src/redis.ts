import { createClient } from "redis";

require("dotenv").config();

const client = createClient({
  url: process.env.REDIS_URL,
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
