 import mongoose from "mongoose";
import { ENV } from "./env.js";

// //const mongoose=require('mongoose')
// //const {ENV}=require('./env.js')

  export const connectDB = async () => {
  try {
//     // For testing purposes, if MongoDB connection fails, we'll log a warning but continue
//     // This allows the server to start even without MongoDB for development
//     try {
//       await mongoose.connect(ENV.MONGODB_URI, {
//         serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
//       });
//       console.log("✅ MongoDB Connected successfully");

//       // Enable transactions (requires replica set in production)
//       if (ENV.NODE_ENV === 'production') {
//         console.log("Transaction support enabled (requires replica set)");
//       }
//     } catch (mongoError) {
//       console.error(" MongoDB Connection Failed:", mongoError.message);
//       console.warn("  Server will start without database connection.");
//       console.warn(" Follow MONGODB_SETUP.md to configure MongoDB");
//       console.warn(" Staff data will NOT be saved until MongoDB is connected");
//     }
//   } catch (err) {
//     console.error(" Database setup error:", err.message);
//     console.warn("  Continuing without database for testing purposes");
//   }
// };

      try{
        await mongoose.connect(ENV.MONGODB_URI ,{
          serverSelectionTimeoutMS:5000,

        });
        console.log("MongoDB connnected successfully")

        if(ENV.NODE_ENV === 'production'){
          console.log("transaction support enabled(requires replica set)")
        }
      }catch(mongoError){
        console.error("mongodb connection failed:",mongoError.message)
        // console.warn("server will start without database connection")
        //  console.warn("follow mongodb setup guide to configure mongodb")
        //  console.warn("staff data will not be seved until mongodb is  connected")
      }
    }catch(err){
      console.error("database setup error:",err.message)
      console.warn("continuing without database for testing purposes")
    }

  };
 export default connectDB;
//module.exports=connectDB