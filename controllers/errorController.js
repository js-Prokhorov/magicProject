const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
    const message = `Неверный ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    
    const message = `Такое имя уже занято: ${value}. Пожалуйста, попробуйте другое!`;
    return new AppError(message, 400);
};
 const handleValidationErrorDB = err => {
     const errors = Object.values(err.errors).map(el => el.message);
     const message = `Неверные входные данные. ${errors.join('. ')}`;
     return new AppError(message, 400);
 };

 const handleJWTError = () => {
     return new AppError('Неверный токен. Пожалуйста, авторизуйтесь!', 401)
 };


const handleJWTExpiredError = () => {
    return new AppError('Истёк срок действия токена. Пожалуйста, авторизуйтесь снова!', 401)
};

const sendErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')){
        //API
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        })
    } else {
        //RENDERED WEBSITE
        res.status(err.statusCode).render('error', {
            title: 'Упс! Что-то пошло не так!',
            msg: err.message
        })
    }
    
};

const sendErrorProd = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')){

        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            })
        } else {
    
            console.error('💥ERROR', err);
    
            res.status(500).json({
                status: 'error',
                message: 'Что-то пошло не так!'
            })
        }
    } else {
        //RENDERED WEBSITE
        if (err.isOperational) {
            res.status(err.statusCode).render('error', {
                title: 'Упс! Что-то пошло не так!',
                msg: err.message
            })
        } else {
    
            console.error('💥ERROR', err);
    
            res.status(err.statusCode).render('error', {
                title: 'Упс! Что-то пошло не так!',
                msg: 'Пожалуста, попробуйте позднее!'
            })
        }
    }
    
}




module.exports = (err,req,res,next) => {
    
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = Object.assign(err)

        if (error.name === 'CastError') {
            error = handleCastErrorDB(error)
        };

        if (error.code === 11000) {
            error = handleDuplicateFieldsDB(error);
        };

        if (error.name === `ValidationError`) {
            error = handleValidationErrorDB(error);
        };

        if (error.name === 'JsonWebTokenError') {
            error = handleJWTError();
        };

        if (error.name === 'TokenExpiredError') {
            error = handleJWTExpiredError()
        };


        sendErrorProd(error, req, res);
    }



     
 }