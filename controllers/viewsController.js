const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');




exports.getOverview = catchAsync (async(req,res, next) => {


    //1) Получить туры из базы данных
    const tours = await Tour.find();

    //2) Построить шаблон


    //3) Срендерить этот шаблон, используя информацию, полученную в 1)




    res.status(200).render('overview', {
      title: 'All Tours',
      tours: tours
    });
  })


exports.getTour = catchAsync (async(req,res, next) => {
//1) Получить данные тура из базы данных (включая отзывы и гидов (populate))
const tour = await Tour.findOne({slug: req.params.slug}).populate({path:'reviews', fields: 'review rating user' });
//2) Построить шаблон


if (!tour) {
  return next(new AppError('Нет тура с таким именем!', 404))
}




    res
    .status(200)
    .set(
        'Content-Security-Policy',
        "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', {
        title: `${tour.name} Tour`,
        tour,
    });
})  


exports.getLoginForm = (req, res) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render('login', {
      title: 'User Login',
    });
};

exports.getAccount = (req,res,next) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render('account', {
      title: 'Your account',
    });
}

exports.updateUserData = catchAsync (async (req, res, next) => {
//  console.log('Это данные из html-формы', req.body);
 const updatedUser = await User.findByIdAndUpdate(req.user.id, {
   name: req.body.name,
   email: req.body.email
 },{
   new: true,
   runValidators: true
 });

 res
    .status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render('account', {
      title: 'Your account',
      user: updatedUser,
    });
})

exports.getMyTours = catchAsync (async (req, res, next) => {
  //1) Найти заказы в базе данных
  const bookings = await Booking.find({user: req.user.id});

  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({_id: {$in: tourIDs}});
  //2 Срендерить страницу заказов

  res.status(200).render('overview', {
    title: 'My Tours',
    tours: tours,
    
  })
  

})