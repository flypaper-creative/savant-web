import express from "express";
import path from "path";

const app = express();
const PORT = 3000;
const root = process.cwd();

app.use(express.static(root));

app.get("/", (_req, res) => {
  res.sendFile(path.join(root, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("SAVANT_SERVER_ACTIVE :: PORT_3000");
});