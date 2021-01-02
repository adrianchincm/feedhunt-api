const express = require('express')
const Product = require('../models/product')
const Cart = require('../models/cart')
const auth = require('../middleware/auth')
const router = new express.Router()
const uploadImage = require('../utility/upload')
const upload = require('../middleware/multer')

router.post('/cart', auth, async (req, res) => {    
    const productId = req.body.product
    const quantity = req.body.quantity
    const action = req.body.action // increment, decrement, set
    
    try {
        let cart = await Cart.findOne({ owner: req.user._id });        
        const product = await Product.findOne({ _id: productId})

        if (!product) {
            return res.status(400).send({ error: 'Invalid product' })
        }

        if (cart) {                    
            let itemIndex = cart.items.findIndex(p => p.product == productId);    
            let productItem = cart.items[itemIndex]
            if (itemIndex > -1) {  
                switch (action) {
                    case 'increment': {
                        productItem.quantity = productItem.quantity + quantity
                        break;
                    }
                    case 'decrement': {
                        productItem.quantity = productItem.quantity - quantity
                        break;
                    }
                    case 'set': {
                        productItem.quantity = quantity
                        break;
                    }
                    default: {
                        productItem.quantity = quantity
                    }
                }                
                productItem.total = (productItem.quantity * product.price).toFixed(2)
                cart.items[itemIndex] = productItem                          
            } else {               
                const total = product.price * quantity
                cart.items.push({ product: productId, quantity, total })
            }

              cart.save()
              res.status(201).send(cart)
        } else {                                   
            const total = product.price * quantity
            const newCart = await Cart.create({
                owner: req.user._id,
                items: [{ product: productId, quantity, total }]
              });
            res.status(201).send(newCart)
        }
    } catch (e) {
        console.log(e)
        return res.status(500).send(e)
    }
})

router.get('/cart', auth, async (req, res) => {

    const cart = await Cart.findOne({ owner: req.user._id })
        .populate('items.product', "-_id -__v -createdAt -updatedAt")
        .populate({ 
            path: 'items.product',
            populate: {
              path: 'owner',
              model: 'User',
              select: "username"
            } 
         })        

    if (cart) {              
        res.status(200).send(cart)
    } else {        
        res.status(200).send({ items: [] })
    }
})

router.delete('/cart/:productId', auth, async (req, res) => {
    const productId = req.params.productId
    console.log(req.user._id)

    try {
        let cart = await Cart.findOne({ owner: req.user._id })        

        if (!cart) {
            return res.status(404).send({ error: 'Cart does not exist'})
        }  

        let itemIndex = cart.items.findIndex(p => p.product == productId);
    
        if (itemIndex <= -1) {
            return res.status(404).send({ error: 'Product does not exist'})
        }        
        
        cart.items.splice(itemIndex, 1)
        
        cart.save()                          

        res.status(200).send(cart)
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router