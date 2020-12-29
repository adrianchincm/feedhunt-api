const express = require('express')
const Post = require('../models/post')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/posts', auth, async (req, res) => {
    
    const post = new Post({
        ...req.body,
        owner: req.user._id
    })

    try {
        await post.save()
        res.status(201).send(post)
    } catch (e) {
        res.status(500).send(e)
    }
})

// GET /posts?completed=true
// GET /posts?limit=10&skip=0
// GET /posts?sortBy=createdAt_desc
router.get('/posts', auth, async (req, res) => {
    const match = {}
    const sort = { 'createdAt': -1 }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')        
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 
    }    

    try {
        await Post.find({ owner: req.user._id }).sort(sort).
            populate('owner',"-_id -__v -password -email -tokens -createdAt -updatedAt").
            exec(function (err, post) {
                    if (err) return handleError(err);                    
                    res.status(200).send(post)    
                });    
        
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/posts/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {        
        const post = await Post.findOne({ _id, owner: req.user._id})

        if (!post) {
            return res.status(404).send()
        }
        res.status(200).send(post)
        
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

module.exports = router