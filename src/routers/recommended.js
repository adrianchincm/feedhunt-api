const express = require('express')
const User = require('../models/user')
const Post = require('../models/post')
const Product = require('../models/product')
const auth = require('../middleware/auth')
const router = new express.Router()
const mongoose = require('mongoose')

// get users who have at least 1 post and 1 product
router.get('/recommended', auth, async (req, res) => {

    let posts = await Post.aggregate([
        {
          $group: {            
            _id: '$owner',
            count: { $sum: 1 }
          }
        }
      ]);

      let products = await Product.aggregate([
        {
          $group: {
            _id: '$owner',
            count: { $sum: 1 }
          }
        }
      ]);

      posts.forEach(function(v){ delete v.count });
      products.forEach(function(v){ delete v.count });

      let postsID = posts.map(a => a._id.toString())
      let productsID = products.map(a => a._id.toString())

      const filteredArray = postsID.filter(value => productsID.includes(value));
      
      const users = await User.find({ _id: filteredArray }).select("username displayname avatar ")

      const usersMinusOwnId = users.filter(user => !user._id.equals(req.user._id))

      const usersMinusAlreadyFollowing = usersMinusOwnId.filter(user => !req.user.following.includes(user._id))    

    res.status(200).send(usersMinusAlreadyFollowing)
   
})

module.exports = router