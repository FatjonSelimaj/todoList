const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// API per ottenere tutte le attività
app.get("/tasks", async (req, res) => {
  const tasks = await prisma.task.findMany();
  res.json(tasks);
});

// API per creare una nuova attività
app.post("/tasks", async (req, res) => {
  const { title, description } = req.body;
  const task = await prisma.task.create({
    data: { title, description },
  });
  res.json(task);
});

// API per aggiornare lo stato di completamento
app.patch("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const task = await prisma.task.update({
    where: { id: Number(id) },
    data: { completed: true },
  });
  res.json(task);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend avviato su http://localhost:${PORT}`);
});
