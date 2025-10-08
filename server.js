import express from "express";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const __dirname = process.cwd();
const PORT = process.env.PORT || 8888;


app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, unique: true },
  year: { type: Number, required: true, min: 1888 },
  rating: {
    type: String,
    required: true,
    enum: ["G", "PG", "PG-13", "R", "NC-17", "Unrated"]
  }
});

const Movie = mongoose.model("Movie", movieSchema);


async function seedIfEmpty() {
  const count = await Movie.countDocuments();
  if (count === 0) {
    await Movie.insertMany([
      { title: "The Lion King", year: 1994, rating: "G" },
      { title: "Inception", year: 2010, rating: "PG-13" }
    ]);
    console.log(" Seeded initial movies with insertMany().");
  }
}


async function updateMovieRating(title, newRating) {
  return Movie.updateOne({ title }, { $set: { rating: newRating } });
}

async function deleteMoviesByRating(rating) {
  return Movie.deleteMany({ rating });
}


app.get("/", async (req, res, next) => {
  try {
    const movies = await Movie.find().sort({ year: 1, title: 1 }).lean();
    res.render("index", { movies });
  } catch (err) {
    next(err);
  }
});

app.get("/seed", async (req, res, next) => {
  try {
    await seedIfEmpty();
    res.redirect("/");
  } catch (err) {
    next(err);
  }
});

app.get("/update-demo", async (req, res, next) => {
  try {
    const result = await updateMovieRating("Inception", "PG");
    res.render("result", {
      title: "Update Demo",
      pre: JSON.stringify(result, null, 2),
      hint: 'Tried: updateMovieRating("Inception", "PG")'
    });
  } catch (err) {
    next(err);
  }
});

app.get("/delete-demo", async (req, res, next) => {
  try {
    const result = await deleteMoviesByRating("R");
    res.render("result", {
      title: "Delete Demo",
      pre: JSON.stringify(result, null, 2),
      hint: 'Tried: deleteMoviesByRating("R")'
    });
  } catch (err) {
    next(err);
  }
});

app.post("/movies", async (req, res, next) => {
  try {
    const { title, year, rating } = req.body;
    await Movie.create({ title, year, rating });
    res.redirect("/");
  } catch (err) {
    next(err);
  }
});

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    await seedIfEmpty();
    app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
  } catch (err) {
    console.error("Mongo connection error:", err);
    process.exit(1);
  }
})();
