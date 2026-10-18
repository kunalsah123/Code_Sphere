const redisClient = require('../config/redis');
const User = require('../models/user');
const validate = require('../utils/validate');
const submission = require('../models/submission')
//for hashing the password
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const cookieOptions = () => ({
    maxAge: 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});



const register = async (req, res) => {
    try {

        //validate where all the fields are present or not
        const registration = validate(req.body);

        //all data  will be in the req.body
        const { firstName, emailId, password } = registration;

        //hashing the password
        const hashedPassword = await bcrypt.hash(password, 10);
        //if all the fields are present then we will create the user
        //we will use the User model to create the user
        const user = await User.create({ firstName, emailId, password: hashedPassword, role: 'user' });
        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role
        }

        const token = jwt.sign({ _id: user._id, emailId: emailId, role: user.role, tokenVersion: user.tokenVersion || 0 }, process.env.JWT_SECRET, { expiresIn: 60 * 60 });

        //setting the token in the cookie
        res.cookie('token', token, cookieOptions());
        res.status(201).json({
            user: reply,
            message: 'User Registered Successfully',
        })

    } catch (err) {
        const duplicateEmail = err.code === 11000 && err.keyPattern?.emailId;
        if (!duplicateEmail) console.error('Registration failed:', err.message);
        return res.status(duplicateEmail ? 409 : 400).json({
            success: false,
            ...(duplicateEmail && { error: 'An account with this email already exists.' }),
            ...(!duplicateEmail && { error: err.message })
        });
    }
}


const login = async (req, res) => {
    try {
        const emailId = typeof req.body?.emailId === 'string' ? req.body.emailId.trim().toLowerCase() : '';
        const password = typeof req.body?.password === 'string' ? req.body.password : '';

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
        const token = jwt.sign({ _id: user._id, emailId: emailId, role: user.role, tokenVersion: user.tokenVersion || 0 }, process.env.JWT_SECRET, { expiresIn: 60 * 60 });
        res.cookie('token', token, cookieOptions());
        res.status(200).json({
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
        if (token && payload?.exp) {
            await redisClient.set(`token:${token}`, 'Blocked', { EXAT: payload.exp });
        }
        //Token added in the Redis Blocklist
        //clearing the cookie

        res.clearCookie('token', cookieOptions());
        res.status(200).send({
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
        const registration = validate(req.body);

        //all data  will be in the req.body
        const { firstName, emailId, password } = registration;

        //hashing the password
        const hashedPassword = await bcrypt.hash(password, 10);


        //if all the fields are present then we will create the user
        //we will use the User model to create the user
        const user = await User.create({ ...registration, password: hashedPassword, role: 'admin' });

        const token = jwt.sign({ _id: user._id, emailId: emailId, role: user.role }, process.env.JWT_SECRET, { expiresIn: 60 * 60 });

        //setting the token in the cookie
        res.cookie('token', token, cookieOptions());
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

const getProfile = async (req, res) => {
    res.json({
        user: {
            _id: req.result._id,
            firstName: req.result.firstName,
            lastName: req.result.lastName || '',
            emailId: req.result.emailId,
            role: req.result.role,
            createdAt: req.result.createdAt
        }
    });
};

const updateProfile = async (req, res) => {
    try {
        const firstName = typeof req.body?.firstName === 'string' ? req.body.firstName.trim() : '';
        const lastName = typeof req.body?.lastName === 'string' ? req.body.lastName.trim() : '';
        if (firstName.length < 3 || firstName.length > 20) {
            return res.status(400).json({ error: 'First name must be between 3 and 20 characters.' });
        }
        if (lastName && (lastName.length < 3 || lastName.length > 20)) {
            return res.status(400).json({ error: 'Last name must be between 3 and 20 characters when provided.' });
        }

        req.result.firstName = firstName;
        req.result.lastName = lastName || undefined;
        await req.result.save();
        res.json({
            user: {
                _id: req.result._id,
                firstName: req.result.firstName,
                lastName: req.result.lastName || '',
                emailId: req.result.emailId,
                role: req.result.role
            },
            message: 'Profile updated.'
        });
    } catch (error) {
        console.error('Profile update failed:', error.message);
        res.status(500).json({ error: 'Could not update your profile.' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body || {};
        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
            return res.status(400).json({ error: 'Current password and new password are required.' });
        }
        if (!validator.isStrongPassword(newPassword, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })) {
            return res.status(400).json({ error: 'New password must have at least 8 characters, including uppercase, lowercase, number, and symbol.' });
        }
        const matches = await bcrypt.compare(currentPassword, req.result.password);
        if (!matches) return res.status(400).json({ error: 'Current password is incorrect.' });
        if (await bcrypt.compare(newPassword, req.result.password)) {
            return res.status(400).json({ error: 'Choose a new password different from your current password.' });
        }

        req.result.password = await bcrypt.hash(newPassword, 10);
        req.result.tokenVersion = (req.result.tokenVersion || 0) + 1;
        await req.result.save();

        const oldToken = req.cookies?.token;
        const oldPayload = oldToken ? jwt.decode(oldToken) : null;
        if (oldToken && oldPayload?.exp) {
            await redisClient.set(`token:${oldToken}`, 'Blocked', { EXAT: oldPayload.exp });
        }
        const token = jwt.sign({
            _id: req.result._id,
            emailId: req.result.emailId,
            role: req.result.role,
            tokenVersion: req.result.tokenVersion
        }, process.env.JWT_SECRET, { expiresIn: 60 * 60 });
        res.cookie('token', token, cookieOptions());
        res.json({ success: true, message: 'Password changed. Other sessions have been signed out.' });
    } catch (error) {
        console.error('Password update failed:', error.message);
        res.status(503).json({ error: 'Could not update your password. Please try again.' });
    }
};

module.exports = { register, login, logout, adminRegister, deleteProfile, getProfile, updateProfile, changePassword };
