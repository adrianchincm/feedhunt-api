const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,        
        trim: true,
    },
    price: {
        type: Number,
        required: true,        
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

productSchema.methods.toJSON = function () {
    const product = this
    const productObject = product.toObject()
    
    delete productObject.__v

    return productObject
}

const Product = mongoose.model('Product', productSchema)

module.exports = Product