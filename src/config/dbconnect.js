const { default:mongoose} = require('mongoose')
require('dotenv').config();

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_MONGO_STRING_URI = process.env.MONGO_STRING_URI
let MONGODB_URI = ""
if (DB_MONGO_STRING_URI) {
    MONGODB_URI = DB_MONGO_STRING_URI
    
} else {
    MONGODB_URI = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

//const MONGODB_URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
console.log("MONGO URI: ", MONGODB_URI)

const dbConnect = async () => {
    try {
        mongoose.set('strictQuery', false)
        const conn = await mongoose.connect(MONGODB_URI)
        if (conn.connection.readyState === 1) {
            console.log('DB connection was successfully');
        } else {
            console.log("DB is connecting!")
        }
    } catch (e) {
        console.log('Error at connecting to MongoDB')
        throw new Error('Cannot connect to the Database:\n' + e)
    }
}

module.exports = dbConnect