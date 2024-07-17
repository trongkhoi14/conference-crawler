const startBrowser = require("./src/untils/browser");
const {
  crawlController,
  crawlConferenceById,
  crawlNewConferenceById,
} = require("./src/controllers/conference-controller");
const dbConnect = require("./src/config/dbconnect");
const { scrapeConference } = require("./src/controllers/pineline-controller");
var cron = require("node-cron");
const express = require("express");
const cookieParser = require("cookie-parser");

const main = async () => {
  // Connect to database
  await dbConnect();

  // Create browser
  let browser = startBrowser();

  // Crawl data
  await crawlController(browser);
};

main();

const app = express();
const port = process.env.PORT || 8081;

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/scrape/conference/:id", scrapeConference);

app.get("/api/scrape", async (req, res) => {
  console.log("I am boring ...");
  await addPendingJobsToQueue();
  res.send(
    "Checked for pending jobs and added to queue if not already present."
  );
});

const addPendingJobsToQueue = async () => {
  const pendingJobs = await jobModel.find({ status: "pending" });

  for (const job of pendingJobs) {
    if (!jobQueue.some((j) => j._id.equals(job._id))) {
      jobQueue.push(job);
    }
  }

  processQueue();
};

//---------- Test---------------
// Kết nối đến MongoDB
const jobModel = require("./src/models/job-model");
const { default: mongoose } = require("mongoose");

const mongoUrl =
  "mongodb+srv://14042002a:luongkhoi123@cluster0.xro9zib.mongodb.net/conference-searching?retryWrites=true&w=majority";

const jobQueue = [];
let isProcessing = false;

dbConnect()
  .then(() => {
    console.log("Connected to MongoDB");
    // Bắt đầu lắng nghe thay đổi sau khi kết nối
    monitorChanges();
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

const updateStatus = async (job) => {
  const startTime = Date.now();
  let isCrawlSuccess;

  if (job.type == "update now") {
    await jobModel.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "processing",
        },
      }
    );
    isCrawlSuccess = await crawlConferenceById(job);
  } else if (job.type == "import conference") {
    await jobModel.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "processing",
        },
      }
    );
    isCrawlSuccess = await crawlNewConferenceById(job);
  } else {
    await jobModel.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "processing",
        },
      }
    );
    isCrawlSuccess = await crawlConferenceById(job);
  }

  console.log(isCrawlSuccess.message);
  const endTime = Date.now();
  const duration = endTime - startTime;

  if (isCrawlSuccess.status) {
    await jobModel.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "completed",
          duration: duration,
        },
      }
    );
  } else {
    await jobModel.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "failed",
          error: isCrawlSuccess.message,
          duration: duration,
        },
      }
    );
  }

  isProcessing = false;
  processQueue();
};

const processQueue = async () => {
  if (jobQueue.length === 0 || isProcessing) {
    return;
  }

  isProcessing = true;
  const job = jobQueue.shift(); // Lấy công việc đầu tiên từ hàng đợi

  const jobExists = await jobModel.findById(job._id);
  if (!jobExists) {
    console.log(`Job with ID ${job._id} no longer exists in the database.`);
    isProcessing = false;
    processQueue();
    return;
  }
  await updateStatus(job);
};

const monitorChanges = async () => {
  try {
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const changeStream = jobModel.watch([
      { $match: { operationType: "insert" } },
    ]);

    changeStream.on("change", async (change) => {
      console.log("Server detected change:", change.fullDocument);
      jobQueue.push(change.fullDocument);
      processQueue();
    });

    console.log("Server is listening for changes...");
  } catch (error) {
    console.error("Error on Server:", error);
  }
};

//----------------------------------

app.listen(process.env.PORT, () => {
  console.log(`Server was running on port ${process.env.PORT}`);
});
