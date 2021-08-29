const AppError = require('./../utils/appError');
const sharp = require('sharp');
const multer = require('multer');
const User = require('./../models/userModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//     //cb - аналог next (просто не из экспресса, поэтому назвать лучше по-другому)
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         // user-345ghfyh457y-timeStamp.jpeg
//         const fileExtension = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${fileExtension}`)
//     }
// })

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    //Проверяем, является ли загружаемый файл картинкой
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Файл не является изображением. Вы можете загрузить только изображение!', 400), false)
    }
}


const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo'); 

exports.resizeUserPhoto = catchAsync (async (req, res, next) => {
    if (!req.file) return next();


    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);
      next();

})

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)){
            newObj[el] = obj[el];
        }
    });

    return newObj;
}


exports.getAllUsers = factory.getAll(User);
exports.createUser = (req,res) => {
    res.status(500).json({
        status: 'error',
        message: 'Этот маршрут не определён. Пожалуйста, используйте маршрут /signup вместо этого!'
    })
};

exports.getMe = (req,res,next) => {
    req.params.id = req.user.id;
    next();
}


exports.updateMe = catchAsync (async(req,res,next) => {
    // console.log(req.file);
    // console.log(req.body);
    //1) Выдать ошибку, если в теле указан пароль (для этого другой маршрут)
    if(req.body.password || req.body.passwordConfirm){
        return next(
          new AppError(
            'Этот маршрут не для обновления пароля. Пожалуйста, используйте специальный для этого /updateMyPassword маршрут',
            400
          )
        );
    }
    //2)Отфильтровать поля. Поле role, например, не должно быть доступно для обновления
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;
    //3)Обновить документ пользователя в базе данных
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});










exports.getUser = factory.getOne(User);

//не обновлять пароль с этим
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.deleteMe = catchAsync (async(req,res,next) => {
    await User.findByIdAndUpdate(req.user._id, {active: false});

    res.status(204).json({
        status: 'success',
        data: null
    })

})