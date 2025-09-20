const redisClient = require('../config/redis');
const User = require('../models/user');
const validate = require('../utils/validate');
const submission = require('../models/submission')
//for hashing the password
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



const register = async (req, res) => {
    try {

        //validate where all the fields are present or not
        validate(req.body);

        //all data  will be in the req.body
        const { firstName, emailId, password } = req.body;

        //hashing the password
        req.body.password = await bcrypt.hash(password, 10);

        //only a user can register
        req.body.role = 'user'; //default role
        //if all the fields are present then we will create the user
        //we will use the User model to create the user
        const user = await User.create(req.body);
        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role
        }

        const token = jwt.sign({ _id: user._id, emailId: emailId, role: user.role }, process.env.JWT_SECRET, { expiresIn: 60 * 60 });

        //setting the token in the cookie
        res.cookie('token', token, { 
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        res.status(201).json({
            user: reply,
            message: 'User Registered Successfully',
        })

    } catch (err) {
        console.error(err);
        return res.status(400).json({
            sucess: false,
            error: err.message
        });
    }
}


const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;

        //checking if the emailId and password are present or not
        if (!emailId || !password) {
            return res.status(400).json({
                sucess: false,
                error: 'Email and Password are required'
            });
        }

        const user = await User.findOne({ emailId });


        //verifying the password
        if (!user) {
            throw new Error('Invalid email or password');
        }
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            throw new Error('Invalid email or password');
        }

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role
        }
        //if the user is found then we will create a token
        const token = jwt.sign({ _id: user._id, emailId: emailId, role: user.role }, process.env.JWT_SECRET, { expiresIn: 60 * 60 });
        res.cookie('token', token, { 
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        res.status(201).json({
            user: reply,
            message: "Loggged in Successfully !!"
        });

    } catch (err) {
        res.status(401).send({
            success: false,
            error: err.message
        });
    }
}

//logout function to clear the cookie

const logout = async (req, res) => {
    try {
        const { token } = req.cookies;

        const payload = jwt.decode(token);


        await redisClient.set(`token:${token}`, 'Blocked');
        await redisClient.expireAt(`token:${token}`, payload.exp);
        //Token added in the Redis Blocklist
        //clearing the cookie

        res.cookie('token', null, { expires: new Date(Date.now()) });
        res.send({
            success: true,
            message: 'User Logged Out successfully'
        });

    } catch (err) {
        res.status(503).send({
            success: false,
            error: err.message
        });
    }
}

//for admin rgistration
const adminRegister = async (req, res) => {
    try {


        //validate where all the fields are present or not
        validate(req.body);

        //all data  will be in the req.body
        const { firstName, emailId, password } = req.body;

        //hashing the password
        req.body.password = await bcrypt.hash(password, 10);


        //if all the fields are present then we will create the user
        //we will use the User model to create the user
        const user = await User.create(req.body);

        const token = jwt.sign({ _id: user._id, emailId: emailId, role: user.role }, process.env.JWT_SECRET, { expiresIn: 60 * 60 });

        //setting the token in the cookie
        res.cookie('token', token, { maxAge: 60 * 60 * 1000 });
        res.status(201).send({
            sucess: true,
            message: 'User Registered Successfully',
        })

    } catch (err) {
        console.error(err);
        return res.status(400).json({
            sucess: false,
            error: err.message
        });
    }
}

const deleteProfile = async (req, res) => {
    try {

        const userId = req.result._id;

        //userSchema se delete kardo
        const deleteUser = await User.findByIdAndDelete(userId);

        if (!deleteUser) res.status(400).send("User Cannot be deleted !!");
        //submission waalo ko bhi delete karna padega
        await submission.deleteMany({ userId });

        res.status(201).send("Profile Deleted Successfully !");



    }
    catch (err) {
        res.status(500).send('Error :' + err);
    }
}

module.exports = { register, login, logout, adminRegister, deleteProfile };