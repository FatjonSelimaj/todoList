const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { validate: isUuid } = require("uuid");
const Joi = require("joi"); // Per validare i dati di input

const app = express();
const prisma = new PrismaClient();

// Configurazione CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://to-do-list-fatjons-projects-d8817ccf.vercel.app",
  process.env.BACKEND_URL || "https://todo-list-bice-rho-61.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((url) => origin.startsWith(url))) {
        callback(null, true);
      } else {
        callback(new Error("Origine non consentita dal CORS"));
      }
    },
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());

// Middleware per log degli errori di Prisma
prisma.$on("error", (e) => {
  console.error("Errore Prisma:", e);
});

// Schema di validazione per task
const taskSchema = Joi.object({
  title: Joi.string().min(1).required(),
  description: Joi.string().allow(null, ""),
});

// API per ottenere tutte le attività
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await prisma.task.findMany();
    res.json(tasks);
  } catch (error) {
    console.error("Errore durante il recupero delle attività:", error.message);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// API per creare una nuova attività
app.post("/tasks", async (req, res) => {
  const { error, value } = taskSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { title, description } = value;

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Errore durante la creazione dell'attività:", error.message);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// API per aggiornare lo stato di completamento
app.patch("/tasks/:id", async (req, res) => {
  const { id } = req.params;

  if (!isUuid(id)) {
    return res.status(400).json({ error: "ID non valido." });
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return res.status(404).json({ error: "Attività non trovata." });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { completed: !existingTask.completed },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error("Errore durante l'aggiornamento dello stato di completamento:", error.message);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Middleware per gestire errori CORS
app.use((err, req, res, next) => {
  if (err.message === "Origine non consentita dal CORS") {
    res.status(403).json({ error: err.message });
  } else {
    next(err);
  }
});

// Middleware per gestire errori generici
app.use((err, req, res, next) => {
  console.error("Errore generale:", err.message);
  res.status(500).json({ error: "Errore interno del server" });
});

// Esporta l'app per Vercel
module.exports = app;
