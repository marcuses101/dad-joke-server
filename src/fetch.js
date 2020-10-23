require("dotenv").config();
const fetch = require("node-fetch");
const dadURL = "https://icanhazdadjoke.com/";
const entitiesURL = `https://language.googleapis.com/v1beta2/documents:analyzeEntities`;
const imageURL = `https://api.cognitive.microsoft.com//bing/v7.0/images/search`;
const { G_API_KEY, AZURE_KEY } = require("./config");
const { memo } = require("./utils");
const excludedSearchTerms = [
  "difference",
  "experience",
  "Legend-dairy",
  "someone",
  "man",
  "dad",
  "one",
  "person",
  "bad",
  "Q",
  "reservation",
  "group",
  "something",
  "kind",
  "puns",
  "word",
  "rest",
  "people",
  "add",
  "thing",
  "guy",
  "Someone",
  "someone",
  "pun",
  "pair",
];

async function getRandomDadJoke() {
  const response = await fetch(dadURL, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(response.status + ": " + response.statusText);
  const data = await response.json();
  return data.joke;
}

//Search jokes by subject. optimized using memo.
const getJokeBySubjectTotalPages = memo(async function (subject) {
  const url = `${dadURL}search?term=${encodeURIComponent(
    subject.trim()
  )}&limit=1`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(response.status);
  const data = await response.json();
  if (!data.total_jokes) throw new Error(404)
  return data.total_jokes;
});

const fetchDadJokeBySubjectAndPage = memo(async function (subject, page) {
  const url = `${dadURL}search?term=${encodeURIComponent(
    subject.trim()
  )}&limit=1&page=${page}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(
      `fetchDadJokeBySubject(${subject}) error:${response.status}`
    );
  const data = await response.json();
  return data.results[0];
});

async function getRandomDadJokeBySubject(subject) {
  const randomPageNumber = Math.ceil(
    Math.random() * (await getJokeBySubjectTotalPages(subject))
  );
  const joke = await fetchDadJokeBySubjectAndPage(subject, randomPageNumber);
  return joke;
}
async function fetchEntities(joke) {
  const content = joke.replace(/\n/g, " ");
  const body = {
    document: {
      content: content,
      type: "PLAIN_TEXT",
    },
    encodingType: "NONE",
  };
  const response = await fetch(entitiesURL + `?key=${G_API_KEY}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(response.statusText);
  const data = await response.json();
  const entities = data.entities.map(entity=>{
    if (/girl/i.test(entity.name)) return 'woman';
    if (entity.name.includes(" ")) return entity.name.split(" ")[0]
    return entity.name
  }).filter(name=>!excludedSearchTerms.includes(name));
  return entities;
}

const getEntities = memo(fetchEntities);

async function fetchImages(keyword) {
  const query = `?q=${keyword}&imagetype=clipart&count=10`;
  const fullURL = imageURL + query;
  const response = await fetch(fullURL, {
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_KEY,
    },
  });
  if (!response.ok)
    throw new Error(response.status + ": " + response.statusText);
  const data = await response.json();
  const images = data.value.map(({ name, thumbnailUrl, contentUrl }) => {
    return { name, thumbnailUrl, contentUrl };
  });
  return images;
}

const getClipArt = memo(fetchImages);

async function getRandomJokeWithArt() {
  const joke = await getRandomDadJoke();
  const entities = await getEntities(joke);
  const images = await getClipArt(entities[0]);
  return { joke, entities, images };
}
async function getSubjectJokeWithArt(subject) {
  const { joke } = await getRandomDadJokeBySubject(subject);
  const entities = await getEntities(joke);
  const images = await getClipArt(entities[0]);
  return { joke, entities, images };
}

module.exports = {
  getRandomJokeWithArt,
  getSubjectJokeWithArt,
};
