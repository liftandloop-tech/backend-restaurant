 const {  mongoose } = require("mongoose");
const { ENV       } =require("./env.js");

  exports. connectDB = async () => {
  try {
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
      }
    }catch(err){
      console.error("database setup error:",err.message)
      console.warn("continuing without database for testing purposes")
    }

  };