const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const AWS = require('aws-sdk');
const router = new express.Router()

// Enter copied or downloaded access ID and secret key here
// const ID = process.env.AWS_KEY_ID;
// const SECRET = process.env.AWS_SECRET_KEY;

// const s3 = new AWS.S3({
//     accessKeyId: ID,
//     secretAccessKey: SECRET
// });

// The name of the bucket that you have created
// const BUCKET_NAME = 'accm-task-manager-app-images';

// index get test endpoint
router.get('', (req, res) => {
    res.status(200).send('index GET endpoint is working')
})


// create users
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send(({user, token}))
    } catch (e) {
        res.status(400).send(e)
    }
})

// login users
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user , token})
    } catch (e) {
        res.status(400).send()
    }
})

// logout user
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send({ success: true })
    } catch (e) {
        res.status(500).send()
    }
})

//logout user from everywhere
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// gets user profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

// follow a user
router.post('/users/follow/:username', auth, async (req, res) => {
    
    const user = await User.findOne({username: req.params.username})    
    req.user.following.push(user._id)

    try {
        await req.user.save()
        res.status(200).send({success: true})
    } catch (e) {
        res.status(404).send(e)
    }
})

// unfollow a user
router.post('/users/unfollow/:username', auth, async (req, res) => {
    
    const user = await User.findOne({username: req.params.username})    
    req.user.following = req.user.following.filter((id) => id != user._id)

    try {
        await req.user.save()
        res.status(200).send({success: true})
    } catch (e) {
        res.status(404).send(e)
    }
})

// router.patch('/users/me', auth, async (req, res) => {
//     const updates = Object.keys(req.body)
//     const allowedUpdates = ['name', 'email', 'password', 'age']
//     const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

//     if (!isValidOperation) {
//         return res.status(400).send({error: 'Invalid updates'})
//     }

//     try {
//         updates.forEach((update) => req.user[update] = req.body[update])
//         await req.user.save() 

//         res.send(req.user)
//     } catch (e) {
//         res.status(400).send(e)
//     }
// })

// router.delete('/users/me', auth, async (req, res) => {
    
//     try {
//         await req.user.remove()
//         res.send(req.user)
//     } catch (e) {
//         res.status(500).send()
//     }
// })

// const upload = multer({
//     limits: {
//         fileSize: 1000000
//     },
//     fileFilter(req, file, cb) {
//         if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
//             return cb(new Error('Please upload jpg, jpeg or png files'))
//         }
//         cb(undefined, true)
//     }
// })

// router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
//     const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()

//     const params = {
//         Bucket: BUCKET_NAME,
//         Key: 'images/test.png', // File name you want to save as in S3
//         Body: buffer
//     };

//     // Uploading files to the bucket
//     s3.upload(params, function(err, data) {
//         if (err) {
//             throw err;
//         }
//         console.log(`File uploaded successfully. ${data.Location}`);
//     });

//     req.user.avatar = buffer
//     await req.user.save()
//     res.send()
// }, (error, req, res, next) => {
//     res.status(400).send({ error: error.message })
// })

// router.delete('/users/me/avatar', auth, async (req, res) => {
//     req.user.avatar = undefined
//     await req.user.save()
//     res.send(req.user)
// })

// router.get('/users/:id/avatar', async (req, res) => {
//     try {
//         const user = await User.findById(req.params.id)

//         if (!user || !user.avatar) {
//             throw new Error()
//         }

//         res.set('Content-Type', 'image/png')
//         res.send(user.avatar)
//     } catch (e) {
//         res.status(404).send()
//     }
// })

module.exports = router