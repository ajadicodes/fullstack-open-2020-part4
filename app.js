const http = require("http");
const express = require("express");
require("express-async-errors");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const blogsRouter = require("./controllers/blogs");
const usersRouter = require("./controllers/users");
const config = require("./utils/config");
const logger = require("./utils/logger");
const middleware = require("./utils/middleware");
const loginRouter = require("./controllers/login");

const mongoUrl = config.MONGODB_URI;
logger.info("connecting to", mongoUrl);

mongoose
  .connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    logger.info("successfully connected to MongoDB");
  })
  .catch((error) => {
    logger.error("error connecting to MongoDB:", error.message);
  });

app.use(cors());
app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.tokenExtractor);

app.use("/api/login", loginRouter);
app.use("/api/blogs", blogsRouter);
app.use("/api/users", usersRouter);

// include the database state reset only when in test mode
// if (process.env.NODE_ENV === "test") {
//   const testingRouter = require("./controllers/testing");
//   app.use("/api/testing", testingRouter);
// }

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
