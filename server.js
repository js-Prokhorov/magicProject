const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});
const app = require('./app');

console.log(process.env.NODE_ENV);
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
  
  useCreateIndex: true, 
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(con => {
  // console.log(con.connections);
  console.log('База данных подключена!');
})




const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});


process.on('unhandledRejection', err => {
  console.log('💥UNHADLED REJECTION! SHUTTING DOWN...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  })
  
});

process.on('uncaughtException', err => {
  console.log('💥UNCAUGHT EXCEPTION! SHUTTING DOWN...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  })
})

