const express = require("express");
const app = express();

const dotenv = require("dotenv");

const connectDB = require("./config/database");
const errorMiddleware = require("./middlewares/errors");
const ErrorHandler = require("./utils/errorHandler");
const cookieParser = require("cookie-parser");

//setting up config.env file variables
dotenv.config({ path: "./config/config.env" });

//handling uncaught exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server due to uncaught exception");
  server.close(() => {
    process.exit(1);
  });
});
// Connecting to db
connectDB();

// setup body parser
app.use(express.json());

// set cookie parser
app.unsubscribe(cookieParser());

// Import all routes
const jobs = require("./routes/jobs");
const auth = require("./routes/auth");

const { connect } = require("./routes/jobs");

app.use("/api/v1", jobs);
app.use("/api/v1", auth);

// handling unhandled routes
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`${req.originalUrl} route not found`, 404));
});

// middleware to handle erro
app.use(errorMiddleware);

const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${process.env.PORT} in ${process.env.NODE_ENV} mode`);
});

// ZmxjuMVl3Z1e4Lur
//

// handling unhandling promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server due to unhandled promise rejection");
  server.close(() => {
    process.exit(1);
  });
});
