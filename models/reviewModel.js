const mongoose = require('mongoose');
const User = require('./userModel');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Поле "Отзыв" не может быть пустым. Пожалуйста, заполните его!']
    },
    rating: {
        type: Number,
        required: [true, 'Отзыв должен иметь рейтинг'],
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now,
        
      },

    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Отзыв должен принадлежать пользователю']
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Отзыв должен принадлежать туру']
    }



    



}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
  });



  reviewSchema.index({tour: 1, user: 1}, {unique: true});


//   reviewSchema.pre(/^find/, function(next){
//       this.populate({
//           path: 'tour',
//           select:'name'
         

//       }).populate({
//           path: 'user',
//           select:'name photo'
//       })

//       next();
//   })
  
  reviewSchema.pre(/^find/, function(next){
    this.populate({
        path: 'user',
        select:'name photo'
    })

    next();
})





reviewSchema.post('save', function(){
    //мы не можем здесь использовать Review, потому что эта модель создаётся ниже. Если поместить этот
    //код под объявление модели, то в ней не будет этого метода schema.post 
    //(использовать нужно пост, т.к aggregate работает с уже созданными документами).
    // Нл есть constructor - это полный аналог
    this.constructor.calculateAverageRating(this.tour);
    
})






// Здесь this указывает на модель
reviewSchema.statics.calculateAverageRating = async function (tourId) {
  const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },

        {
            $group: { _id: '$tour', nRating: {$sum: 1}, avgRating: {$avg: '$rating'}}
        }


    ])

    // console.log(stats);
    if(stats.length > 0 ) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    };
    
}



reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r = await this.findOne();
//    console.log(this.r);
   next();
})

reviewSchema.post(/^findOneAnd/, async function(next){
    await this.r.constructor.calculateAverageRating(this.r.tour);
 })

const Review = mongoose.model('Review', reviewSchema);


module.exports = Review;