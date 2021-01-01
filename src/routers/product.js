const express = require('express')
const Product = require('../models/product')
// const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const uploadImage = require('../utility/upload')
const upload = require('../middleware/multer')

router.post('/products', auth, upload.single('image'), async (req, res) => {
    let productWithImage
    let product = new Product({
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,        
        owner: req.user._id
    })

    if (req.file) {
        await uploadImage(req)
        .then(result => {                  
            productWithImage = new Product({
                title: req.body.title,
                description: req.body.description,
                price: req.body.price,        
                owner: req.user._id,
                imageURL: result.Location
            })            
        }).catch(error => res.status(500).send(error))                                    
    } 
    
    try {
        if (productWithImage) {
            await productWithImage.save() 
            res.status(201).send(productWithImage)
        } else {
            await product.save() 
            res.status(201).send(product)
        }        
    } catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
})

router.get('/products', auth, async (req, res) => {
    const match = {}
    const sort = { 'createdAt': -1 }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')        
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 
    }    

    try {
        products = await Product.find({ owner: req.user._id }).sort(sort)
        res.status(200).send(products)                 
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router