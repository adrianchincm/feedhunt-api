const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const sharp = require('sharp')
// const Task = require('./task')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },    
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,    
        validate(value) {
            if (value.includes('password')) {
                throw new Error('Password cannot be password')
            }          
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

// userSchema.virtual('tasks', {
//     ref: 'Task',
//     localField: '_id',
//     foreignField: 'owner'
// })

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    delete userObject.__v

    return userObject
}

userSchema.statics.findByCredentials = async (email, password) => {
    const userEmail = await User.findOne({ email })
    const username = await User.findOne({ username: email })

    if (!userEmail && !username) {
        throw new Error ('Unable to login')
    }

    const authUser = userEmail || username

    const isMatch = await bcrypt.compare(password, authUser.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return authUser
}

userSchema.methods.generateAuthToken = async function () {
    const user = this

    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}




// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Delete user tasks when user is removed

userSchema.pre('remove', async function (next) {
    const user = this

    await Task.deleteMany({ owner: user._id })

    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User