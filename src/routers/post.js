const express = require('express')
const Post = require('../models/post')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const uploadImage = require('../utility/upload')
const upload = require('../middleware/multer')

router.post('/posts', auth, upload.single('image'), async (req, res) => {
    let postWithImage
    let post = new Post({
        content: req.body.content,
        owner: req.user._id,
        products: req.body.products
    })

    if (req.file) {
        await uploadImage(req)
        .then(result => {                  
            postWithImage = new Post({
                content: req.body.content,
                owner: req.user._id,
                products: req.body.products,
                imageURL: result.Location
            })            
        }).catch(error => res.status(500).send(error))                                    
    } 
    
    try {
        if (postWithImage) {
            await postWithImage.save() 
            res.status(201).send(postWithImage)
        } else {
            await post.save() 
            res.status(201).send(post)
        }        
    } catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
})

// GET /posts?completed=true
// GET /posts?limit=10&skip=0
// GET /posts?sortBy=createdAt_desc
router.get('/posts/me', auth, async (req, res) => {
    const match = {}
    const sort = { 'createdAt': -1 }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')        
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 
    }    

    try {
        await Post.find({ owner: req.user._id }).sort(sort)
            .populate('owner',"-_id -__v -password -email -tokens -createdAt -updatedAt -following")
            .populate('products',"-__v -createdAt -updatedAt -following")
            .exec(function (err, post) {
                    if (err) return handleError(err);                    
                    res.status(200).send(post)    
                });    
        
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/posts/following', auth, async (req, res) => {
    const match = {}
    // default : load latest posts first
    const sort = { 'createdAt': -1 }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')        
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 
    }    

    const followingWithUser = req.user.following.concat(req.user._id)    

    try {
        await Post.find({owner: {"$in": followingWithUser}}).sort(sort)
            .populate('owner',"-_id -__v -password -email -tokens -createdAt -updatedAt")
            .populate('products',"-__v -createdAt -updatedAt -following")
            .exec(function (err, post) {                
                    if (err) return handleError(err);                    
                    res.status(200).send(post)    
                });    
        
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/posts/user/:username', auth, async (req, res) => {
    const sort = { 'createdAt': -1 }
    const username = req.params.username

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')        
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 
    }   

    try {
        let postCount
        let followerCount        
        const user = await User.findOne({ username })        

        const posts = await Post.find({ owner: user._id }).sort(sort)
            .populate('owner',"-_id -__v -password -email -tokens -createdAt -updatedAt -following")
            .populate('products',"-__v -createdAt -updatedAt -following")        

        await Post.find({ owner: user._id }).countDocuments(function(err, count) {
                if (err) return res.send({error : 'Can\'t find posts count'}).status(404)
                postCount = count
          });
   
        const followers = await User.find({ following: user._id }).countDocuments(function(err, count) {
            if (err) return res.send({error : 'Can\'t find followers count'}).status(404)
            followerCount = count
        });  
        
        const following = user.following.length         
        
        user.set('following', undefined, {strict: false} );

        const userProfile = {
            user,
            posts,
            totalPosts: postCount,
            following,
            followers
        }
        
        res.status(200).send(userProfile)
        
    } catch (e) {
        
        res.status(500).send(e)
    }
})



router.patch('/posts/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['content']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates'})
    }

    try {
        const post = await Post.findOne(({ _id: req.params.id, owner: req.user._id}))

        if (!post) {
            return res.status(404).send()
        }

        
        updates.forEach((update) => post[update] = req.body[update])
        await post.save()
        res.send(post)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/posts/:id', auth, async (req, res) => {
    try {
        const post = await Post.findOneAndDelete(({ _id: req.params.id, owner: req.user._id }))
        
        if (!post) {
            return res.status(404).send()
        }        

        res.send(post)
    } catch (e) {
        res.status(500).send()
    }
})

//




// router.post('/upload', auth, upload.single('image'), async (req, res) => {
//     console.log(req.body.content)
    
//     await uploadImage(req).then(result =>
//         res.send(result)
//     )        
    
// }, (error, req, res, next) => {
//     res.status(400).send({ error: error.message })
// })



module.exports = router