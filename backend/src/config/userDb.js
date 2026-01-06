import mongoose from 'mongoose'


const UsuariosDB = async () => {
    try {
        const db = await mongoose.connect(process.env.MONGO_URI_USERS, {
                 useNewUrlParser: true,
                 useUnifiedTopology: true,
            });
      const url = `${db.connection.host}:${db.connection.port}`;
      console.log(`BD usuarios : ${url}`);
      
    } catch (error) {
        console.log(`error: ${error.message}`);
        process.exit(1);
    }
}

export default UsuariosDB;