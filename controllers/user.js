import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { mailTransporter, registerUserMailTemplate } from "../utils/mail.js";
import { loginUserValidator, registerUserValidator, updateUserValidator } from "../validators/user.js";
import { UserModel } from "../models/user.js";

export const registerUser = async (req, res, next ) => {
    // validate user info
    const { error, value } = registerUserValidator.validate(req.body);
    if (error) {
        return res.status(422).json(error);
    }
    // check if user doesnt already exist
    const user = await UserModel.findOne({
        $or: [
            { userName: value.userName},
            { email: value.email}
        ]
    });
    if (user) {
        return res.status(409).json('user already exist!');
    }
    // hash plaintext password
    const hashedPassword = bcrypt.hashSync(value.password, 10);
    // create user record in database
    const result = await UserModel.create({
        ...value,
        password: hashedPassword
    });
    // send registration email to user
     mailTransporter.sendMail({
        from: 'ibrah.webdev@gmail.com',
        to: value.email,
        subject: 'Checking out nodemailer',
        html: registerUserMailTemplate.replace('{{userName}}', value.userName ),
    })
    // (optional) generate a token
    // return response
    res.status(201).json('user registered successfully');
}

export const loginUser = async (req, res, next) => {
    // validate user information 
    const { error, value } = loginUserValidator.validate(req.body);
    if (error) {
        return res.status(422).json(error);
    }
    // find matching user record 
    const user = await UserModel.findOne({
        $or: [
            { userName: value.userName},
            { email: value.email}
        ]
    });
    if (!user) {
        return res.status(404).json('user does not exist!');
    }
    // compare incoming password with saved password
    const correctPassword = bcrypt.compareSync(value.password, user.password);
    if (!correctPassword){
        return res.status(401).json('Invalid credentials');
    }
    // Generate access token 
    const accessToken = jwt.sign(
       { id : user.id},
        process.env.JWT_SECRET_KEY,
            { expiresIn: '24h'}
    );
    // Return response
    res.status(200).json({
         accessToken,
         user:{
            role: user.role,
            email: user.email
         } 
        });
}

export const updateUser = async(req, res, next) => {
    //  Validate request body
    const {error, value} = updateUserValidator.validate(req.body);
    if (error) {
        return res.status(422).json(error);
    }
    //  Update user in database
    const result = await UserModel.findByIdAndUpdate(
        req.params.id,
        value,
        {new: true }
    );
    // return response
    res.status(200).json(result);
}

export const getAuthenticatedUser = async (req, res, next) =>{
    // Get user by id using req.auth.id
    try {
        const result = await UserModel
              .findById(req.auth.id)
              .select({ password: false});
//  Return response 
res.status(200).json(result);
    } catch (error) {
        
    }

}