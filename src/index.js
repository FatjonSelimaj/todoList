const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { validate: isUuid } = require("uuid"); // Per validare UUID

const app = express();
const prisma = new PrismaClient();

// Configurazione CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://to-do-list-fatjons-projects-d8817ccf.vercel.app/", // URL del frontend
  process.env.BACKEND_URL || "https://todo-list-bice-rho-61.vercel.app/"  // URL del backend (opzionale)
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Consenti richieste senza origine (es. Postman) o da origini consentite
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Non permesso dall'origine CORS"));
      }
    },
    methods: ["GET", "POST", "PATCH"], // Metodi HTTP consentiti
    credentials: true, // Se necessario per cookie o autenticazione
  })
);

app.use(express.json());

// API per ottenere tutte le attività
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await prisma.task.findMany();
    res.json(tasks);
  } catch (error) {
    console.error("Errore durante il recupero delle attività:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// API per creare una nuova attività
app.post("/tasks", async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Il campo 'title' è obbligatorio." });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Errore durante la creazione dell'attività:", error);
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
    console.error("Errore durante l'aggiornamento dello stato di completamento:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Esporta l'app per Vercel
module.exports = app;
