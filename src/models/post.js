const mongoose = require('mongoose')
const User = require('./user')

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
    },
    imageURL: {
        type: String,        
        trim: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },  
}, {
    timestamps: true,    
})

postSchema.methods.toJSON = function () {
    const post = this
    const postObject = post.toObject()
    
    delete postObject.__v

    return postObject
}

const Post = mongoose.model('Post', postSchema)

module.exports = Post