const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");
dotenv.config({ path: "./config.env" });
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
//1)connecting DB.
mongoose.set("strictQuery", true);
mongoose
  .connect(DB)
  .then(() => console.log("DB connection successful!"))
  .catch((e) => console.log(e));

//2)starting the server/express App
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
