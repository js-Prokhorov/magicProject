const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csp = require('express-csp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes.js');
const viewRouter = require('./routes/viewRoutes.js');
const bookingRouter = require('./routes/bookingRoutes.js');
//Starts our app
const app = express();
app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// GLOBAL MIDDLEWARES
//Implement CORS
app.use(cors());

//set security http headers
app.use(helmet());
csp.extend(app, {
  policy: {
    directives: {
      'default-src': ['self'],
      'style-src': ['self', 'unsafe-inline', 'https:'],
      'font-src': ['self', 'https://fonts.gstatic.com'],
      'script-src': [
        'self',
        'unsafe-inline',
        'data',
        'blob',
        'https://js.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:8828',
        'ws://localhost:56558/',
      ],
      'worker-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:*',
        'ws://localhost:*/',
      ],
      'frame-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:*',
        'ws://localhost:*/',
      ],
      'img-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:*',
        'ws://localhost:*/',
      ],
      'connect-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        `wss://mighty-ridge-10238.herokuapp.com:${process.env.PORT}/`,
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:*',
        'ws://localhost:*/',
      ],
    },
  },
});

//development logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
};
//Ограничить количество запросов с одного ip
const limiter = rateLimit({
    max: 30,
    windowMs: 60 * 60 * 1000,
    message: 'Слишком много запросов с этого IP, пожалуйста попробуйте снова через час!'
});

app.use('/api', limiter);


//Чтение данных body в req.body, Т.е это Body parser
app.use(express.json({limit: '10kb' }));
//Парсинг данных, которые идут из html-формы
app.use(express.urlencoded({extended: true, limit: '10kb'}));
app.use(cookieParser());

//Data sanitazation against NoSQL query injection
app.use(mongoSanitize());

//Data sanitazation against XSS
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'maxGroupSize',
      'difficulty',
      'price',
      'ratingsAverage',
      'ratingsQuantity',
    ],
  })
);


//Сжимает текст (html или json), отправляемый клиенту, с изображениями не работает
app.use(compression());

app.use((req,res,next) => {
    req.requestTime = new Date().toISOString();
    
    next();
});
// app.get('/', (req, res) => {
// res.status(200).json({message: 'Привет с сервера!', app: 'magicProject'})
// })

// app.post('/', (req, res) => {
//     res.send('Сюда ты можешь постить методом ПОСТ!')
// })





// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

//ROUTE





app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req,res,next) => {
    
    // const err = new Error(`Не могу найти ${req.originalUrl} на этом сервере`);
    // err.status = 'fail';
    // err.statusCode = 404;
    next(new AppError(`Не могу найти ${req.originalUrl} на этом сервере`, 404));
})

app.use(globalErrorHandler);
module.exports = app;
