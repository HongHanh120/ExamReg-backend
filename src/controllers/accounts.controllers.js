const bcrypt = require("bcrypt");
const config = require("config");
const jwt = require("jsonwebtoken");
const responseUtil = require("../utils/response.util");

const account = require("../models/accounts.models");
const examination = require("../models/examinations.models");
const subjectClass = require("../models/classes.models");

async function login(req, res) {
    const {
        username,
        password
    } = req.body;
    try {
        let [user] = await account.getUserByUsername(username);
        if (!user.length)
            throw new Error("User name or password is incorrect");
        user = user[0];
        const hashPassword = user.password;
        const checkPass = bcrypt.compareSync(password, hashPassword);

        if (!checkPass)
            throw new Error("User name or password is incorrect");

        const twentyFourHours = 24 * 60 * 60 * 100;

        const token = jwt.sign({
                id: user.id,
                username: user.username
            },
            config.get("SECRET_KEY"), {
                expiresIn: twentyFourHours
            }
        );

        let [role_id] = await account.getRole(username);
        role_id = role_id[0].role_id;
        let admin = 0;
        if (role_id === 1 || role_id === 3)
            admin = 1;

        res.json(responseUtil.success({data: {token, admin}}));
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
    try {
        if (username.length < 8)
            throw new Error("Username must greater than 8 characters");
        if (password.length < 8)
            throw new Error("Password must greater than 8 characters");
        if (password !== re_password)
            throw new Error("Your password and confirmation password do not match");
        if (!date_of_birth)
            throw new Error("Date of birth field is missing");
        if (!fullname)
            throw new Error("Full name field is missing");
        if (!email)
            throw new Error("Email field is missing");

        const [existedUser] = await account.getUserByUsername(username);
        const [existedEmail] = await account.getUserByEmail(email);
        if (existedUser.length)
            throw new Error("Username is existed");
        if (existedEmail.length)
            throw new Error("Email is existed");

        let salt = await bcrypt.genSalt(10);
        let hashPassword = await bcrypt.hash(password, salt);

        await account.createUser(username, hashPassword, fullname, date_of_birth, "", email);
        let [user] = await account.getUserByUsername(username);
        user = user[0].id;
        await account.changeRole(user);

        res.json(responseUtil.success({data: {}}));
    } catch (err) {
        res.json(responseUtil.fail({reason: err.message}));
    }
}

async function getAdminList(req, res) {
    const {keywords} = req.query;
    try {
        let rows = [];
        if (keywords) {
            let [admin] = await account.getUserByKeyword(keywords, 1);
            let [superAdmin] = await account.getUserByKeyword(keywords, 3);
            for (let i = 0; i < admin.length; i++)
                rows.push(admin[i]);
            for (let i = 0; i < superAdmin.length; i++)
                rows.push(superAdmin[i]);
            console.log(rows);
        } else
            [rows] = await account.getAllAdmin();
        res.json(responseUtil.success({data: {rows}}));
    } catch (err) {
        res.json(responseUtil.fail({reason: err.message}));
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
            throw new Error("Please enter your old password");
        if (!new_password)
            throw new Error("Please enter your new password");
        if (new_password.length < 8)
            throw new Error("Password must greater than 8 characters");
        if (!confirm_new_password)
            throw new Error("Please confirm new password");
        if (new_password !== confirm_new_password)
            throw new Error("Your password and confirmation password do not match");

        let salt = await bcrypt.genSalt(10);
        const [existedUser] = await account.getUserById(id);
        const validatePassword = await bcrypt.compare(old_password, existedUser[0].password);
        if (!validatePassword)
            throw new Error("Your old password is wrong");

        let hashPassword = await bcrypt.hash(new_password, salt);
        await account.updatePassword(id, hashPassword);

        res.json(responseUtil.success({data: {}}));
    } catch (err) {
        res.json(responseUtil.fail({reason: err.message}));
    }
}

async function getCurrentExaminationToken(req, res) {
    const {
        examination_id
    } = req.params;

    try {
        let [rows] = await examination.getExaminationById(examination_id);
        if (!rows.length)
            throw new Error("This examination is not existed");
        console.log(req.tokenData.id);
        const now = Date.now().toString().slice(0, 10);
        const expToken = req.tokenData.exp - now;

        const examinationToken = jwt.sign({
                id: req.tokenData.id,
                examination_id
            },
            config.get("EXAMINATION_SECRET_KEY"), {
                expiresIn: expToken
            }
        );
        res.json(responseUtil.success({data: {examinationToken}}));
    } catch (err) {
        res.json(responseUtil.fail({reason: err.message}));
    }
}

async function updateInformation(req, res) {
    const {id} = req.tokenData;
    const {
        fullname,
        date_of_birth,
        email
    } = req.body;

    try {
        if (!fullname)
            throw new Error("Fullname field is missing");
        if (!date_of_birth)
            throw new Error("Date_of_birth field is missing");
        if (!email)
            throw new Error("Email field is missing");

        const [existedUser] = await account.getUserById(id);
        if (!existedUser.length)
            throw new Error("This user is not existed");

        const [existedEmail] = await account.getUserByEmail(email);
        if (existedEmail.length)
            throw new Error("This email is used by other account");

        await account.updateInformation(id, fullname, date_of_birth, email);
        res.json(responseUtil.success({data: {}}));
    } catch (err) {
        res.json(responseUtil.fail({reason: err.message}));
    }
}

async function deleteUser(req, res) {
    const {member_id} = req.query;
    try {
        if (!member_id)
            throw new Error("Member_id field is missing");
        await account.deleteUserById(member_id);
        res.json(responseUtil.success({data: {}}));
    } catch (err) {
        res.json(responseUtil.fail({reason: err.message}));
    }
}

async function getAllAccount(req, res) {
    const {keywords} = req.query;
    try {
        let rows = [];
        if (keywords)
            [rows] = await account.getUserByKeyword(keywords, "");
        else
            [rows] = await account.getAllAccounts();
        res.json(responseUtil.success({data: {rows}}));
    } catch (err) {
        res.json(responseUtil.fail({reason: err.message}));
    }
}

async function getAllNotEligibleStudents(req, res) {
    const {examination_id} = req.tokenData;
    try {
        let rows = [];
        let [notEligibleStudents] = await account.getNotEligibleStudent(examination_id);
        for (let i = 0; i < notEligibleStudents.length; i++) {
            let id = notEligibleStudents[0].id;
            let username = notEligibleStudents[0].username;
            let fullname = notEligibleStudents[0].fullname;
            let course_class = notEligibleStudents[0].course_class;
            let nameSubject = notEligibleStudents[0].name;

            let [subjectClassInf] = await subjectClass.getClassById(notEligibleStudents[i].class_code_id);
            let subject_code = subjectClassInf[0].subject_code;
            let class_code = subjectClassInf[0].class_code;
            let subject_class = subject_code + " " + class_code.toString();

            let row = {id, username, fullname, course_class, subject_class, nameSubject};
            rows.push(row);
        }
        res.json(responseUtil.success({data: {rows}}));
    } catch (err) {
        res.json(responseUtil.fail({reason: err.message}));
    }
}

module.exports = {
    login,
    register,
    changePassword,
    getAdminList,
    getCurrentExaminationToken,
    updateInformation,
    deleteUser,
    getAllAccount,
    getAllNotEligibleStudents
};
