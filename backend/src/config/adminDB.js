import mongoose from 'mongoose'


const AdminDB = async () => {
    try {
        const db = await mongoose.connect(process.env.MONGO_URI_ADMIN, {
                 useNewUrlParser: true,
                 useUnifiedTopology: true,
            });
      const url = `${db.connection.host}:${db.connection.port}`;
      console.log(`BD admin : ${url}`);
      
    } catch (error) {
        console.log(`error: ${error.message}`);
        process.exit(1);
    }
}

export default AdminDB;