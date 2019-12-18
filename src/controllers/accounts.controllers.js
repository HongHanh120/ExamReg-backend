const bcrypt = require('bcrypt');
const config = require('config');
const jwt = require('jsonwebtoken');
const responseUtil = require('../utils/response.util');

const account = require('../models/accounts.models');

async function login(req, res) {
    const {
        username,
        password
    } = req.body;
    try {
        let [user] = await account.getUserByUsername(username);
        if (!user.length)
            throw new Error('User name or password is incorrect');
        user = user[0];
        const hashPassword = user.password;
        const checkPass = bcrypt.compareSync(password, hashPassword);

        if (!checkPass)
            throw new Error('User name or password is incorrect');

        const twentyFourHours = 24 * 60 * 60 * 100;

        const token = jwt.sign({
                id: user.id,
                username: user.username
            },
            config.get('SECRET_KEY'), {
                expiresIn: twentyFourHours
            }
        );

        res.json(responseUtil.success({data: {token}}));
    } catch (err) {
        res.json(responseUtil.fail({reason: err.message}));
    }
};

async function register(req, res) {
    const {
        username,
        password,
        re_password,
        fullname,
        date_of_birth,
        email
    } = req.body;
    console.log(req.body.username);
    const [a] = await account.getUserByUsername("hanh2001");
    try {
        if (username.length < 8)
            throw new Error('Username must greater than 8 characters');
        if (password.length < 8)
            throw new Error('Password must greater than 8 characters');
        if (password !== re_password)
            throw new Error('Your password and confirmation password do not match');
        if (!date_of_birth)
            throw new Error('Date of birth field is missing');
        if (!fullname)
            throw new Error('Full name field is missing');
        if (!email)
            throw new Error('Email field is missing');

        const [existedUser] = await account.getUserByUsername(username);
        const [existedEmail] = await account.getUserByEmail(email);
        if (existedUser.length)
            throw new Error('Username is existed');
        if (existedEmail.length)
            throw new Error('Email is existed');

        let salt = await bcrypt.genSalt(10);
        let hashPassword = await bcrypt.hash(password, salt);

        await account.createUser(username, hashPassword, fullname, date_of_birth, '', email);

        res.json(responseUtil.success({data: {}}));
    } catch (err) {
        res.json(responseUtil.fail({reason: err.message}));
    }
}

async function getStudentList(req, res) {
    try{
        const [rows] = await account.getAllStudent();
        res.json(responseUtil.success({data: {rows}}));
    } catch (err) {
        res.json(responseUtil.fail({reason: err.message}))
    }
}

async function changePassword(req, res) {
    const {
        old_password,
        new_password,
        confirm_new_password
    } = req.body;
    const {id} = req.tokenData;
    try {
        if (!old_password)
            throw new Error('Please enter your old password');
        if (!new_password)
            throw new Error('Please enter your new password');
        if (new_password.length < 8)
            throw new Error('Password must greater than 8 characters');
        if (!confirm_new_password)
            throw new Error('Please confirm new password');
        if (new_password !== confirm_new_password)
            throw new Error('Your password and confirmation password do not match');

        let salt = await bcrypt.genSalt(10);
        const [existedUser] = await account.getUserById(id);
        const validatePassword = await bcrypt.compare(old_password, existedUser[0].password);
        if (!validatePassword)
            throw new Error('Your old password is wrong');

        let hashPassword = await bcrypt.hash(new_password, salt);
        await account.updatePassword(id, hashPassword);

        res.json(responseUtil.success({data: {}}));
    } catch (err) {
        res.json(responseUtil.fail({reason: err.message}));
    }
}

module.exports = {
    login,
    register,
    changePassword,
    getStudentList
};
