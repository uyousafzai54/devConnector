const express = require('express');
const router = express.Router();
const gravatar = require('gravatar'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const config = require('config');
const {check, validationResult} = require('express-validator/check'); 

const User = require('../../models/User'); 

//@route POST api/users
//@desc Register user
//@access Public
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email address').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({min: 6}),
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()}); 
    }
    console.log(req.body);
    const {name, email, password} = req.body; //So you don't have to do req.body.name etc.

    try {
        //See if user exists
        let user = await User.findOne({email});

        if(user) {
            return res.status(400).json({erros: [{msg: 'User already exists'}]}); //If res.status is not the last res.status statement 
        }

        //Get users gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name, 
            email,
            avatar,
            password
        });

        //Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        //Save user to db
        await user.save(); //because user.save returns a promise

        //Return JWT
        const payload = {
            user: {
                id: user.id
            }
        }

        //sign the token
        jwt.sign(payload, config.get('jwtSecret'), {expiresIn: 360000}, (err, token) => {
            if(err) throw err;
            res.json({ token }); 
        }); 
    }  catch(err) {
        console.error(err.message);
        //res.status(500).send('Server error'); 
    }

});

module.exports = router; 