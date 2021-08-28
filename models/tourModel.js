const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');


const tourSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Тур должен иметь имя'],
      unique: true,
      maxlength: [40, 'Имя тура должно быть не более 40 символов'],
      minlength: [10, 'Имя тура должно быть не менее 10 символов'],
      // validate: [validator.isAlpha, 'Имя может состоять только из латинских букв']
  
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Тур должен иметь продолжительность']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Тур должен иметь размер группы']
    },
    difficulty: {
      type: String,
      required: [true, 'Тур должен иметь сложность'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Сложность тура может быть: easy, medium или dificult'
      }
    },


    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Рейтинг должен быть больше 1'],
      max: [5, 'Рейтинг должен быть ниже 5'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'Тур должен иметь цену']
    },
    priceDiscount: {
     type: Number,
     validate: {
       validator: function(val) {
         //this указывает на текущий документ только при создании нового документа, при обновлении не будет
        return val < this.price; 
      },
      message: 'Скидка ({VALUE}) не может быть выше цены'
     }  
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Тур должен иметь описание']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'Тур должен иметь обложку']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },

    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']

      },
      coordinates: [Number],
      adress: String,
      description: String
      
    },

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },

        coordinates: [Number],
        adress: String,
        description: String,
        day: Number

      }
    ],
    
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]


  }, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
  });
  

  tourSchema.index({price: 1, ratingsAverage: -1});
  tourSchema.index({slug: 1});
  tourSchema.index({ startLocation: '2dsphere' });


  tourSchema.virtual('durationInWeeks').get(function(){
    return this.duration / 7;
  }) 

//Virtual populate так мы можем получить доступ к отзывам без хранения их в турах
  tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
  })


  //DOCUMENT MIDDLEWARE: RUNS BEFORE .SAVE() AND .CREATE()
  tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, {lower: true});
    next();
  });






// Embeding version of relations of tour with users
  // tourSchema.pre('save', async function(next) {
  //   //Асинхронная функция возвращает промис
  //   const guidesPromises = this.guides.map(async id => {
  //    return await User.findById(id)
  //   });

  //   this.guides = await Promise.all(guidesPromises);


  //   next();
  // })
  // Embeding version of relations of tour with users





  // tourSchema.post('save', function(savedDoc, next){
  //   console.log(savedDoc);
  //   next();
  // })

  //QUERY MIDDLEWARE
  tourSchema.pre(/^find/, function(next){
    this.find({secretTour: {$ne: true}});
    this.start = Date.now();
    next();
  })
  
  tourSchema.pre(/^find/, function(next) {
    this.populate({
      path: 'guides',
      select: '-__v -passwordChangedAt'
    });


    next();
  })


  tourSchema.post(/^find/, function(documents, next){
    console.log(`Обработка квэри (Query) заняла ${Date.now() - this.start} милисекунд`);
    // console.log(documents);
    next();
  })



  //AGGREGATION MIDDLEWARE
  // tourSchema.pre('aggregate', function(next){
  //   this.pipeline().unshift({$match: {secretTour: {$ne: true}}});
  //   console.log(this.pipeline());
  //   next();
  // });



  


  const Tour = mongoose.model('Tour', tourSchema);

  module.exports = Tour;