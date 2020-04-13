"use strict";

// load modules
const express = require("express");
const morgan = require("morgan");
const routes = require("./routes/routes");
const sequelize = require("./models").sequelize;

// variable to enable global error logging
const enableGlobalErrorLogging =
  process.env.ENABLE_GLOBAL_ERROR_LOGGING === "true";

// create the Express app
const app = express();

app.use(express.json());

// setup morgan which gives us http request logging
app.use(morgan("dev"));

// TODO setup your api routes here

// setup a friendly greeting for the root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the REST API project!",
  });
});

app.use("/api", routes);

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: "Route Not Found",
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  // if this is a sequelize validation error, status code 400
  if (err.name === "SequelizeValidationError") {
    res.status(err.status || 400).json({
      message: err.message,
      error: {},
    });
  } else {
    res.status(err.status || 500).json({
      message: err.message,
      error: {},
    });
  }


});

// set our port
app.set("port", process.env.PORT || 5000);

// start listening on our port
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection to the database successful!");
    const server = app.listen(app.get("port"), () => {
      console.log(
        `Express server is listening on port ${server.address().port}`
      );
    });
  } catch (error) {
    console.error("Error connecting to the database: ", error);
  }
})();