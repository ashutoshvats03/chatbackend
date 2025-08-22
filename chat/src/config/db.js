import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
    const url = process.env.MONGO_URL;
    if(!url){
        throw new Erro("Mongoose not defined");
    }
    try{
        await mongoose.connect(url,{
            dbName: "ChatApp",
        });
        console.log("DB connected");
    } catch (error){
        console.log(error);
        process.exit(1);
    }
};

export default connectDB;