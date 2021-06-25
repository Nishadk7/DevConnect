const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const auth = require('../../middleware/auth');
const Post = require('../../models/Post');
const request = require('request');
const config = require('config');
const { check, validationResult } = require('express-validator');
const Profiles = require('../../models/Profiles');
const { json } = require('express');

//@route    POST api/post
//@desc     create a post
//@access   Public
router.post(
	'/',
	[auth, [check('text', 'Text is required').not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			const user = await User.findById(req.user.id).select('-password');
			const newPost = new Post({
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			});

			const post = await newPost.save();

			res.json(post);
		} catch (error) {
			console.error(error.message);
			res.status(500).send('server error');
		}
	}
);

//@route    GET api/post/
//@desc     get all post
//@access   Private

router.get('/', auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({ date: -1 });
		res.json(posts);
	} catch (err) {
		res.status(500).send('Sever Error');
		console.error(err.message);
	}
});

//@route    GET api/post/:post_id
//@desc     get a post by id
//@access   Private

router.get('/:post_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);
		if (!post) {
			return res.status(404).send('Post not found');
		}
		res.json(post);
	} catch (err) {
		if (err.kind == 'ObjectId') {
			return res.status(404).send('Post not found');
		}
		res.status(500).send('Sever Error');
		console.error(err.message);
	}
});

//@route    DELETE api/post/:post_id
//@desc     delete a post
//@access   Private

router.delete('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		//checking if the user deleting the post is the owner of the post
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'Youre not authorized' });
		}
		if (!post) {
			return res.status(404).send('Post not found');
		}
		await post.remove();
		res.json({ msg: 'Post Removed' });
	} catch (err) {
		console.error(err);
	}
});

//@route    PUT api/post/like/:post_id
//@desc     like a post
//@access   Private

router.put('/like/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (
			post.likes.filter((like) => like.user.toString() === req.user.id).length >
			0
		) {
			return res.status(400).json({ msg: 'Post already liked ' });
		}
		post.likes.unshift({ user: req.user.id });
		await post.save();
		return res.json(post.likes);
	} catch (err) {
		console.error(err);
		res.status(500).send('Server Error');
	}
});

//@route    PUT api/post/unlike/:post_id
//@desc     like a post
//@access   Private

router.put('/unlike/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (
			post.likes.filter((like) => like.user.toString() === req.user.id)
				.length === 0
		) {
			return res.status(400).json({ msg: 'Post not yet liked ' });
		}
		const removeIndex = post.likes
			.map((like) => like.user.toString())
			.indexOf(req.user.id);
		post.likes.splice(removeIndex, 1);
		await post.save();
		return res.json(post.likes);
	} catch (err) {
		console.error(err);
		res.status(500).send('Server Error');
	}
});

module.exports = router;
