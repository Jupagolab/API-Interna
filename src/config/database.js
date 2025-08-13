import mongoose from "mongoose";

const { DB_HOST, DB_NAME, DB_PASS } = process.env;

const URI = `mongodb+srv://${DB_HOST}:${DB_PASS}@holanet.zhebwun.mongodb.net/${DB_NAME}?retryWrites=true&w=majority&appName=Holanet`;

mongoose.connect(URI, {})
  .then(() => console.log(`Database has been conected`))
  .catch((error) => console.log(`Ha ocurrido un error: ${error.toString()}`));