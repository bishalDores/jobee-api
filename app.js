const express = require("express");
const app = express();

const dotenv = require("dotenv");

const connectDB = require("./config/database");

//setting up config.env file variables
dotenv.config({ path: "./config/config.env" });

// Connecting to db
connectDB();

// setup body parser
app.use(express.json());

// Import all routes
const jobs = require("./routes/jobs");

const { connect } = require("./routes/jobs");

app.use("/api/v1", jobs);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server started on port ${process.env.PORT} in ${process.env.NODE_ENV} mode`);
});

// ZmxjuMVl3Z1e4Lur
//
