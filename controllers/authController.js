const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Sign-up
exports.signUp = async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        const verificationLink = `http://localhost:3000/verify/${newUser.verificationToken}`;
        const transporter = nodemailer.createTransport({ service: 'Gmail', auth: { user: 'your-email', pass: 'your-password' } });
        await transporter.sendMail({
            to: email,
            subject: 'Email Verification',
            text: `Click this link to verify your email: ${verificationLink}`
        });

        res.status(201).json({ message: 'User registered. Check email for verification link.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (!user.isVerified) return res.status(401).json({ message: 'Email not verified.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

        const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Email Verification
exports.verifyEmail = async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User.findOne({ verificationToken: token });
        if (!user) return res.status(404).json({ message: 'Invalid verification token.' });

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

