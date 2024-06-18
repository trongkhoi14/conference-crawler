const startBrowser = require('./src/untils/browser');
const { crawlController, crawlConferenceById } = require('./src/controllers/conference-controller')
const { notificationController } = require('./src/controllers/notification-controller')
const { dataPinelineAPI } = require('./src/etl/datapineline')
const dbConnect = require('./src/config/dbconnect');
const { scrapeConference } = require('./src/controllers/pineline-controller')
var cron = require('node-cron');
const express = require('express');
const cookieParser = require('cookie-parser')

const main = async () => {
    // Connect to database
    await dbConnect();

    // Create browser
    let browser = startBrowser();

    // Crawl data
    await crawlController(browser);
   
};  

main();

const app = express()
const port = process.env.PORT || 8081

app.use(cookieParser())

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get('/api/scrape/conference/:id', scrapeConference)

//---------- Test---------------
// Kết nối đến MongoDB
const jobModel = require('./src/models/job-model')
const { default:mongoose} = require('mongoose')

const mongoUrl = "mongodb+srv://14042002a:luongkhoi123@cluster0.xro9zib.mongodb.net/conference-searching?retryWrites=true&w=majority";

dbConnect().then(() => {
    console.log("Connected to MongoDB");
    // Bắt đầu lắng nghe thay đổi sau khi kết nối
    monitorChanges();
  }).catch(err => {
    console.error("Failed to connect to MongoDB", err);
  });

const updateStatus = async(fullDocument) => {
    const startTime = Date.now();
    const isCrawlSuccess = await crawlConferenceById(fullDocument.conf_id)
    const endTime = Date.now();
    const duration = endTime - startTime; 
    if(isCrawlSuccess.status) {
        return await jobModel.updateOne({ _id: fullDocument._id }, { 
            $set: { 
                status: "completed",
                duration: duration
            } 
        });
    }
    else {
        return await jobModel.updateOne({ _id: fullDocument._id }, { 
            $set: { 
                status: "failed",
                error: isCrawlSuccess.message,
                duration: duration
            } 
        });
    }
}

const monitorChanges = async () => {
try {
    await mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
    });

    const changeStream = jobModel.watch([{ $match: { 'operationType': 'insert' } }]);

    changeStream.on('change', (change) => {
        console.log('Server detected change:', change.fullDocument);
        updateStatus(change.fullDocument);
    });

    console.log('Server is listening for changes...');
} catch (error) {
    console.error('Error on Server:', error);
}
};





// const Agenda = require('agenda');
// const jobModel = require('./src/models/job-model')

// const mongoUrl = "mongodb+srv://14042002a:luongkhoi123@cluster0.xro9zib.mongodb.net/conference-searching?retryWrites=true&w=majority"
// const agenda = new Agenda({ db: { address: mongoUrl, collection: 'agenda_jobs' } });

// dbConnect().then(async()=>{
//     await agenda.start();
//     console.log("Agenda started ...")
// })

// const crawlData = async (conf_id) => {
//     try {
//         console.log("Crawling ... " + conf_id)
//       const response = {data: "oke"};
//       return response.data;
//     } catch (error) {
//       console.error(`Error crawling data for conf_id: ${conf_id}`, error);
//       throw error;
//     }
//   };

// agenda.define('crawl data', async (job, done) => {
//     const { conf_id, jobId } = job.attrs.data;
  
//     try {
//       const data = await crawlData(conf_id);
        
//       await jobModel.findByIdAndUpdate(jobId, {
//         status: 'completed',
//         data
//       });
  
//       console.log(`Job ${jobId} completed`);
//       done()
//     } catch (error) {
//       await jobModel.findByIdAndUpdate(jobId, {
//         status: 'failed',
//         error: error.message
//       });
//       done(error)
//       console.error(`Job ${jobId} failed with error: ${error.message}`);
//     }
//   });


 

//----------------------------------

app.listen(process.env.PORT, ()=> {
    console.log(`Server was running on port ${process.env.PORT}`)
})