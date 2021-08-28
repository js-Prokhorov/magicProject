// const fs = require('fs');
const AppError = require('./../utils/appError');
const sharp = require('sharp');
const multer = require('multer');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
//   );

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  //Проверяем, является ли загружаемый файл картинкой
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Файл не является изображением. Вы можете загрузить только изображение!',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();
  //1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];
  //async-функция возвращает промис, поэтому мы сохраняем все эти промисы в массив, а потом все их исполним.
  //Иначе, с простым перебором forEach, например, мы перейдём к next() прежде, чем что-то попадёт в req.body.images
  await Promise.all(req.files.images.map(async (file, idx) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${idx + 1}.jpeg`;
    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${filename}`);

    req.body.images.push(filename);
  }));
  console.log(req.body);

  next();
});

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync (async(req, res, next) => {

// const tour = await Tour.findByIdAndDelete(req.params.id);

// if(!tour){
//   return next(new AppError("Тура с таким ID в базе данных нет", 404))
// }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });

// });

exports.topTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },

    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        averageRating: { $avg: '$ratingsAverage' },
        averagePrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },

    {
      $sort: { numRatings: 1 },
    },
    // {
    //   $match: {_id: {$ne: 'MEDIUM'}}
    // }
  ]);

  res.status(200).json({
    status: 'success',

    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 1,
    },
  ]);

  res.status(200).json({
    status: 'success',

    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    new AppError(
      'Пожалуйста, предоставьте latitude и longitude в формате lat,lng',
      400
    );
  }
  console.log(distance, lat, lng, unit);
  //МангоДБ ожидает радиус в радианах, для этого нужно нашу величину поделить на радиус Земли в милях(3963.2)/км(6378.1)

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    new AppError(
      'Пожалуйста, предоставьте latitude и longitude в формате lat,lng',
      400
    );
  }

  const distances = await Tour.aggregate([
    //$geoNear всегда первый и единственный этап
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },

    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: {
      data: distances,
    },
  });
});
