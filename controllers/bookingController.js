const Stripe = require('stripe');
const AppError = require('./../utils/appError');
const sharp = require('sharp');
const multer = require('multer');
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');






// exports.getCheckoutSession = catchAsync (async (req,res,next) => {
// //1) Получить тур, который сейчас заказывают
// await Tour.findById(req.params.tourId)
// //2) Создать checkout session
// //3) Отправить клиенту

// })

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);
   
    // 2) Create Checkout session
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            },
          },
        },
      ],
    });
   
    // 3) Create Session as response
    res.status(200).set(
        'Content-Security-Policy',
        "connect-src 'self' https://cdnjs.cloudflare.com"
      ).json({
      status: 'success',
      session,
    });
  });

  exports.createBookingCheckout = catchAsync (async (req,res,next) => {
      const {tour, user, price} = req.query;
      if(!tour || !user || !price) return next();
      await Booking.create({tour, user, price});
      res.redirect(req.originalUrl.split('?')[0]);

  });

  exports.createBooking = factory.createOne(Booking);
  exports.getBooking = factory.getOne(Booking);
  exports.getAllBookings = factory.getAll(Booking);
  exports.updateBooking = factory.updateOne(Booking);
  exports.deleteBooking = factory.deleteOne(Booking);