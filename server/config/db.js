import mongoose from 'mongoose';

let dbConnection = null;

const connectDB = async () => {
  if (dbConnection) {
    return dbConnection;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    dbConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return dbConnection;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
