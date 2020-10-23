require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV, DAD_API } = require("./config");
const expressSanitizer = require("express-sanitizer");
const { getRandomJokeWithArt, getSubjectJokeWithArt } = require("./fetch");
const logger = require("../logger");

const app = express();

const morganOption = NODE_ENV === "production" ? "tiny" : "dev";

//comment
app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(expressSanitizer());

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.use((req,res,next)=>{
  if(!req.query.key || req.query.key !== DAD_API) {
    return res.status(401).json({error: 'Unauthorized request'})
  }
  next();
})

app.get("/random", async (req, res, next) => {
  try {
    const jokeObject = await getRandomJokeWithArt();
    res.json(jokeObject);
  } catch (e) {
    next(e);
  }
});

app.get("/search", async (req, res, next) => {
  const subject = req.sanitize(req.query.subject);
  if (!subject)
    return res
      .status(400)
      .json({ error: { message: "search didn't produce any jokes" } });
  try {
    const jokeObject = await getSubjectJokeWithArt(subject);
    res.json(jokeObject);
  } catch (error) {
    if (error.message == 404) {
      logger.error(error);
      return res.status(404).json({ error: "no search results found" });
    }
    next(error);
  }
});


app.use((error, req, res, next) => {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    response = { message: error.message, error };
  }
  logger.error(error);
  res.status(500).json(response);
});

module.exports = app;
