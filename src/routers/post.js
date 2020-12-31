const express = require('express')
const Post = require('../models/post')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const AWS = require('aws-sdk');
const router = new express.Router()

const ID = process.env.AWS_KEY_ID;
const SECRET = process.env.AWS_SECRET_KEY;

const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});

// The name of the bucket that you have created
const BUCKET_NAME = 'feedhunt-public';

router.post('/posts', auth, upload.single('image'), async (req, res) => {
    let postWithImage
    let post = new Post({
        content: req.body.content,
        owner: req.user._id
    })

    if (req.file) {
        await uploadImage(req)
        .then(result => {                  
            postWithImage = new Post({
                content: req.body.content,
                owner: req.user._id,
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
        await Post.find({ owner: req.user._id }).sort(sort).
            populate('owner',"-_id -__v -password -email -tokens -createdAt -updatedAt -following").
            exec(function (err, post) {
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
        await Post.find({owner: {"$in": followingWithUser}}).sort(sort).
            populate('owner',"-_id -__v -password -email -tokens -createdAt -updatedAt").
            exec(function (err, post) {                
                    if (err) return handleError(err);                    
                    res.status(200).send(post)    
                });    
        
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/posts/user/:username', auth, async (req, res) => {
    const username = req.params.username

    try {
        let postCount
        let followerCount        
        const user = await User.findOne({ username })        

        const posts = await Post.find({ owner: user._id }).
        populate('owner',"-_id -__v -password -email -tokens -createdAt -updatedAt -following")
        // .exec(function (err, post) {                
        //         if (err) return res.send({error : 'Can\'t populate posts\' owner fields'}).status(404)
                
        //         posts = post
        //     }).then();    

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

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload jpg, jpeg or png files'))
        }
        cb(undefined, true)
    }
})

const uploadImage = async (req) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 500 }).png().toBuffer()
    const timestamp = Date.now()
    const params = {
        Bucket: BUCKET_NAME,
        Key: `feedhunt-images/${req.file.originalname}-${timestamp}.png`, // File name you want to save as in S3
        Body: buffer
    };

    // Uploading files to the bucket
    const uploaded = s3.upload(params).promise()
    return uploaded
}


// router.post('/upload', auth, upload.single('image'), async (req, res) => {
//     console.log(req.body.content)
    
//     await uploadImage(req).then(result =>
//         res.send(result)
//     )        
    
// }, (error, req, res, next) => {
//     res.status(400).send({ error: error.message })
// })



module.exports = router