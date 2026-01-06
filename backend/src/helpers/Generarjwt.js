import jwt from 'jsonwebtoken';

const generarJWT = (id, rol = 'user') => {
    return jwt.sign(
        { 
            id,
            rol 
        }, 
        process.env.JWT_SECRET, 
        {
            expiresIn: "30d",
        }
    );
};

export default generarJWT;