const AppError = require('./../utils/appError');
const Review = require('./../models/reviewModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');


exports.getAllReviews = factory.getAll(Review);



exports.getReview = factory.getOne(Review);
exports.createReview = catchAsync (async(req,res,next) => {
    //Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    const newReview = await Review.create(req.body);


    res.status(201).json({
        status: 'success',
        data: {
            review: newReview
        }
    })
})


exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);