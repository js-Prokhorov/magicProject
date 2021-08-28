const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Неоходимо указать имя']
    },
    email: {
        type: String, 
        lowercase: true,
        required: [true, 'Необходимо указать E-Mail'],
        unique: true,
        validate: [validator.isEmail, 'Пожалуйста, укажите действительный E-Mail']

    },

    role: {
        type: String,
        default: 'user',
        enum: ['user','guide','lead-guide','admin']
    },
    active: Boolean,
    photo: {
        type: String,
        default: 'default.jpg'
    },
    password:{
        type: String,
        required: [true, 'Пожалуйста, введите пароль'],
        minlength: 8,
        select: false
    }, 
    passwordConfirm: {
       type: String,
       required: [true, 'Пожалуйста, подтвердите пароль'],
       validate: {
           //Работает только при методах .SAVE и .CREATE
           validator: function (el){
               return el === this.password;
           },
           message: 'Пароли не совпадают!'
       }

    },

    passwordChangedAt: {
        type: Date
    },

    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;

    next();
});

userSchema.pre('save', async function(next){
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 2000;
    next();
});

userSchema.pre(/^find/, function(next) {
    //this здесь указывает на текущий query. Это query-middleware.
    this.find({active: {$ne: false}})
    next();
});


userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp){

    if(this.passwordChangedAt) {
        const convertedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000);
        
        return JWTTimeStamp < convertedTimeStamp;
    }


 //false значит пароль не менялся после выдачи токена
    return false;
};

//Создание токена (не jwt-токена) для восставновления пароля
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log({resetToken}, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};


const User = mongoose.model('User', userSchema);

module.exports = User;