const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Product' 
        },
        quantity: {
            type: Number,
            required: true,        
        },
        total: {
            type: Number,        
        },    
    }],    
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'        
    },    
    grandTotal: {
        type: Number,        
    },    
}, {
    timestamps: true,    
})

cartSchema.methods.toJSON = function () {
    const cart = this
    const cartObject = cart.toObject()
    
    delete cartObject.__v

    return cartObject
}

const Cart = mongoose.model('Cart', cartSchema)

module.exports = Cart