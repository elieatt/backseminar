const express = require('express');
const router = express.Router();
const Livestream = require('../models/livestreamingModel');

// GET all livestreams
router.get('/', (req, res, next) => {
  Livestream.find()
    .populate('broadcaster', '_id name email uuid')
    .then((livestreams) => {
      res.status(200).json(livestreams);
    })
    .catch((err) => next(err));
});

// GET a single livestream by id
router.get('/:id', (req, res, next) => {
  Livestream.findById(req.params.id)
    .populate('broadcaster', '_id name email uuid')
    .then((livestream) => {
      if (!livestream) {
        const err = new Error('Livestream not found');
        err.status = 404;
        throw err;
      }
      res.status(200).json(livestream);
    })
    .catch((err) => next(err));
});

// POST a new livestream
router.post('/', (req, res, next) => {
  const livestream = new Livestream({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    broadcaster: req.body.broadcaster
  });
  livestream.save()
    .then((savedLivestream) => {
      res.status(201).json(savedLivestream);
    })
    .catch((err) => next(err));
});

// PUT (update) a livestream by id
router.put('/:id', (req, res, next) => {
  Livestream.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('broadcaster', '_id name email uuid')
    .then((updatedLivestream) => {
      if (!updatedLivestream) {
        const err = new Error('Livestream not found');
        err.status = 404;
        throw err;
      }
      res.status(200).json(updatedLivestream);
    })
    .catch((err) => next(err));
});

// DELETE a livestream by id
router.delete('/:id', (req, res, next) => {
  Livestream.findByIdAndDelete(req.params.id)
    .then((deletedLivestream) => {
      if (!deletedLivestream) {
        const err = new Error('Livestream not found');
        err.status = 404;
        throw err;
      }
      res.status(200).json(deletedLivestream);
    })
    .catch((err) => next(err));
});
router.get('/messages/:id', async (req, res, next) => {
  try {
    const userId = req._id;
    const ls = await Livestream.findById(req.params.id);
    if (ls && ls.viewers.users.some(obj => obj.user.equals(userId))) {
      const arr = await Livestream.findById(req.params.id).populate('messages.message');
      const messages=arr.messages;
      res.status(200).json({
        messages: messages
      });
      return;
    }
    res.status(400);
    return;
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: 'error'
    });
  }

});

module.exports = router;