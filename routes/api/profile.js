const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profiles');
const request = require('request');
const config = require('config');
const { check, validationResult } = require('express-validator');
const Profiles = require('../../models/Profiles');
//@route    GET api/profile
//@desc     get current users profile
//@access   Private

router.get('/me', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate(
			'user',
			['name', 'avatar']
		);
		if (!profile) {
			return res.status(400).json({ msg: 'No profile found for this user' });
		}

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

//@route    POST api/profile
//@desc     Create/Update user profile
//@access   Private

router.post(
	'/',
	[
		auth,
		[
			check('status', 'Status is required').not().isEmpty(),
			check('skills', 'Skills is required').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		// destructure the request
		const {
			company,
			website,
			skills,
			bio,
			location,
			githubusername,
			status,
			youtube,
			twitter,
			instagram,
			linkedin,
			facebook,
			// spread the rest of the fields we don't need to check
			...rest
		} = req.body;

		//build profile object

		const profileFields = {};
		profileFields.user = req.user.id;
		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (bio) profileFields.bio = bio;
		if (status) profileFields.status = status;
		if (githubusername) profileFields.githubusername = githubusername;
		if (skills) {
			profileFields.skills = skills.split(',').map((skill) => skill.trim());
			console.log(profileFields.skills);
		}
		//Build social object
		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (twitter) profileFields.social.twitter = twitter;
		if (linkedin) profileFields.social.linkedin = linkedin;
		if (facebook) profileFields.social.facebook = facebook;
		if (instagram) profileFields.social.instagram = instagram;

		const socialFields = { youtube, twitter, instagram, linkedin, facebook };
		try {
			//If profile found we update
			let profile = await Profile.findOne({ user: req.user.id });
			if (profile) {
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);
				return res.json(profile);
			}
			//if profile not found we create new profile
			profile = new Profile(profileFields);
			await profile.save();
			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('server error');
		}
	}
);

//@route    GET api/profile
//@desc     get all the profiles
//@access   Public

router.get('/', async (req, res) => {
	try {
		const profiles = await Profile.find().populate('user', ['name', 'avatar']);
		res.json(profiles);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('server error ');
	}
});

//@route    GET api/profile/user/:user_id
//@desc     get profile by user id
//@access   Public

router.get('/user/:user_id', async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id,
		}).populate('user', ['name', 'avatar']);
		if (!profile) {
			return res.status(400).json({ msg: 'Proflile not found   ' });
		}

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		if (err.kind == 'ObjectId') {
			return res.status(400).json({ msg: 'Proflile not found ' });
		}
		res.status(500).send('server error ');
	}
});

//@route    DELETE api/profile
//@desc     delete profile, user and post
//@access   Private

router.delete('/', auth, async (req, res) => {
	try {
		//Remove Profile
		//TODO - remove user posts
		await Profile.findOneAndRemove({ user: req.user.id });
		//Remove User
		await User.findOneAndRemove({ _id: req.user.id });
		return res.json({ msg: 'user removed' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send('server error ');
	}
});

//@route    PUT api/profile/experience
//@desc     Add profile experience
//@access   Private

router.put(
	'/experience',
	[
		auth,
		[
			check('title', 'Title is required').not().isEmpty(),
			check('company', 'Company is required').not().isEmpty(),
			check('from', 'From Date is required').not().isEmpty(),
		],
	],

	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
		}

		const newExp = ({ title, company, from, to, current, description } =
			req.body);
		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.experience.unshift(newExp);
			await profile.save();
			res.json(profile);
		} catch (error) {
			console.error(error.message);
			res.status(500).send('Server Error');
		}
	}
);

//@route    DELETE api/profile/experience
//@desc     delete experience
//@access   Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
	try {
		//Removing experience using its id
		const profile = await Profile.findOne({ user: req.user.id });
		const removeIndex = profile.experience
			.map((item) => item.id)
			.indexOf(req.params.exp_id);
		await profile.experience.splice(removeIndex, 1);
		await profile.save();

		return res.json({ msg: 'experience removed' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send('server error ');
	}
});

//@route    PUT api/profile/education
//@desc     Add profile education
//@access   Private

router.put(
	'/education',
	[
		auth,
		[
			check('school', 'school is required').not().isEmpty(),
			check('degree', 'degree is required').not().isEmpty(),
			check('fieldofstudy', 'Field of study is required').not().isEmpty(),
			check('from', 'From Date is required').not().isEmpty(),
		],
	],

	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
		}
		//const { school, degree, fieldofstudy, from, to, current, description } =
		//	req.body;

		const newEdu = ({
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description,
		} = req.body);

		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.education.unshift(newEdu);
			await profile.save();
			res.json(profile);
		} catch (error) {
			console.error(error.message);
			res.status(500).send('Server Error');
		}
	}
);

//@route    DELETE api/profile/education/:edu_id
//@desc     delete education
//@access   Private

router.delete('/education/:edu_id', auth, async (req, res) => {
	try {
		//Removing experience using its id
		const profile = await Profile.findOne({ user: req.user.id });
		const removeIndex = profile.education
			.map((item) => item.id)
			.indexOf(req.params.edu_id);
		await profile.education.splice(removeIndex, 1);
		await profile.save();

		return res.json({ msg: 'educ	ation removed' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send('server error ');
	}
});

//@route    GET api/profile/github/:username
//@desc     get github repos
//@access   Public

router.get('/github/:username', (req, res) => {
	try {
		const options = {
			uri: ` https://api.github.com/users/${
				req.params.username
			}/repos?per_page=5&sort=created: asc&client_id=${config.get(
				'githubClientId'
			)}&client_secret=${config.get('githubSecret')}`,
			method: 'GET',
			headers: { 'user-agent': 'node.js' },
		};
		request(options, (error, response, body) => {
			if (error) {
				console.error(error);
			}
			if (response.statusCode != 200) {
				return res.status(404).json({ msg: 'No github profile fuond' });
			}
			res.json(JSON.parse(body));
		});
	} catch (error) {
		res.status(500).send('Server Error');
	}
});

module.exports = router;
