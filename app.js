const express = require("express");
const app = express();

const dotenv = require("dotenv");

const connectDB = require("./config/database");
const errorMiddleware = require("./middlewares/errors");
const ErrorHandler = require("./utils/errorHandler");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");

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

// setting up http headers
app.use(helmet());

// setup body parser
app.use(express.json());

// set cookie parser
app.use(cookieParser());

// handle file upload
app.use(fileUpload());

// sanitize data
app.use(mongoSanitize());

// xss clean
app.use(xss());

// rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(cors());
// Apply the rate limiting middleware to all requests
app.use(limiter);

// prevent parameter pollution
app.use(hpp());

// Import all routes
const jobs = require("./routes/jobs");
const auth = require("./routes/auth");
const user = require("./routes/user");

const { connect } = require("./routes/jobs");

app.use("/api/v1", jobs);
app.use("/api/v1", auth);
app.use("/api/v1", user);

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
