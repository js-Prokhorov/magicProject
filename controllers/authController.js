const crypto = require('crypto');  
const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
    return jwt.sign({id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
};


const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        
        httpOnly: true,
      };

    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    };

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined;


    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req,res,next) => {

    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);
    
});


exports.login = catchAsync (async (req,res,next) => {
    const {email, password} = req.body;
    
    //1) Проверить существуют ли имейл и пароль
    if(!email || !password) {
      return  next(new AppError('Пожалуйста укажите имейл и пароль', 400))
    }

    //2) Проверить существует ли пользователь и верен ли пароль
    const user = await User.findOne({email: email}).select('+password');
    

    if (!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError('Неверный имейл или пароль', 401))
    };

    console.log(user);

    //3) Если всё верно, отправить токен клиенту
    createSendToken(user, 200, res);

})


//Only for rendered pages, there are not going to be any errors!
exports.isLoggedIn = async (req,res,next) => {
    
    
    
     if (req.cookies.jwt) {
         try {
        
       

    //1) верифицировать токен
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
      console.log(decoded);
    //2)Проверить, существует ли всё ещё пользователь
    const checkedUser = await User.findById(decoded.id);

    if(!checkedUser){
        return next()
    };

    //4)Проверить, сменил ли пользователь пароль, после того, как был выдан jwt-токен

    if(checkedUser.changedPasswordAfter(decoded.iat)){
        return next()
    };

  
    
    
    //Есть залогиненый пользователь (раз уж дошли до этой строчки)
    //Всё, что мы кладём в .locals будет доступно в шаблоне 
    res.locals.user = checkedUser;
    // req.user = checkedUser;
    return next();
         } catch (err) {
             return next();
         }    
}
    next();

}


exports.logout = (req, res, next) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 *1000),
        httpOnly: true
    })
    res.status(200).json({
        status: 'success'
    })
}

exports.protect = catchAsync (async (req,res,next) => {
    let token;
    
    //1)Убедиться, что есть токен, что он существует
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt
    }

    console.log(token);

    if (!token) {
        return next(new AppError('Вы не вошли в аккаунт. Пожалуйста, авторизуйтесь!', 401))
    }

    //2)Верифицировать токен
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      console.log(decoded);
    //3)Проверить, существует ли всё ещё пользователь
    const checkedUser = await User.findById(decoded.id);
    if(!checkedUser){
        return next(new AppError('Пользователя, которому принадлежал этот токен, больше не существует', 401))
    }

    //4)Проверить, сменил ли пользователь пароль, после того, как был выдан jwt-токен

    if(checkedUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('Пароль недавно поменялся. Пожалуйста, авторизуйтесь снова!', 401))
    };

  
    
    
    //Предоставить доступ к защищённому пути
    console.log(`User ID from authController.protect function: ${checkedUser._id}`);
    req.user = checkedUser;
    res.locals.user = checkedUser;
    next();
})



exports.restrictTo = (...roles) => {

    return (req,res,next) => {
        //roles - это массив. например ['admin', 'lead-guide'] role=user
        if(!roles.includes(req.user.role)) {
            return next(new AppError('У Вас нет разрешения выполнить это действие', 403))
        }

        next();
    }

}


exports.forgotPassword = catchAsync (async (req,res,next) => {

    //1)Получить пользователя из базы данных по присланному имейл
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new AppError('Пользователя с таким почтовым адрессом не существует', 404))
    }

    //2)Сгенерировать рандомный reset-токен

    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});


    //3)Отправить его на имейл пользователю
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    console.log(resetURL);
    const message = `Забыли свой пароль? Отправьте patch-запрос 
    с Вашим новым паролем (и подтверждённым паролем) по адрессу: ${resetURL}. \n Если Вы не отправляли запрос на восстановление пароля,
    пожалуйста, проигнорируйте данное письмо!`;

    try {
        // await sendEmail({
        //     email: user.email,
        //     subject: 'Ваш токен для восстановления пароля (действителен 10 минут)',
        //     message: message
        // });
        await new Email(user, resetURL).sendPasswordReset();
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});
        return next(new AppError('Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте ещё раз позднее!', 500));
    }

    
    
    res.status(200).json({
        status: 'success', 
        message: 'Токен отправлен на имейл'
    });


})

exports.resetPassword = catchAsync (async(req,res,next) => {
    //1) Найти пользователя в базе данных по присланному токену (не jwt-токену, он часть URL) 
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    //2) Если не истёк срок действия этого токена, и пользователь существует, установить новый пароль
    if(!user){
        return next(new AppError('Неверный токен или истёк срок его действия', 400))
    };
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    //3) Обновить поле passwordChangedAt для этого пользователя

    
    //4) Авторизовать пользователя, отправить ему jwt-токен
    createSendToken(user, 200, res);

});

exports.updatePassword = catchAsync (async(req,res,next) => {

    //1)Найти пользователя в базе данных
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('Ваш текущий пароль неверен', 401))
    };
    //2)Проверить, верен ли присланный POSTed пароль
    
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    //3)Если да, то обновить пароль

    //4)Авторизовать пользователя, прислать ему jwt-токен
    createSendToken(user, 200, res);


});