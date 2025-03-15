import mongoose from 'mongoose';

export async function connect() {
    try{
        mongoose.connect(process.env.MONGO_URI!);
        const connection = mongoose.connection;

        connection.on('connected', () => {
            console.log('Database connected');
        });

        connection.on('error', (err) => {
            console.log('Error connecting to database '+ err);
            process.exit(1);
        });


        } catch (error) {
        console.error('Something went wrong!');
        console.error(error);
    }
}   