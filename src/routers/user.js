const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const uploadImage = require('../utility/upload')
const upload = require('../middleware/multer')
const router = new express.Router()

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

// update user's displayname or password
router.patch('/users/me', auth, upload.single('image'), async (req, res) => {
    console.log(req.body)
    const updates = Object.keys(req.body)
    
    const allowedUpdates = ['displayname', 'password']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates'})
    }

    try {

        if (req.file) {
            await uploadImage(req)
            .then(result => {                  
                req.user.avatar = result.Location
                                     
            }).catch(error => res.status(500).send(error))             
        }

        updates.forEach((update) => req.user[update] = req.body[update])    
        
        await req.user.save()
        
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// router.delete('/users/me', auth, async (req, res) => {
    
//     try {
//         await req.user.remove()
//         res.send(req.user)
//     } catch (e) {
//         res.status(500).send()
//     }
// })

module.exports = router