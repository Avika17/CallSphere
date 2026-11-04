import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import { compare, hash } from "bcrypt";

import crypto from "crypto"
import { Meeting } from "../models/meeting.model.js";

const login = async (req, res) => {
    const { username, password } = req.body;
    console.log(`[AUTH] Login attempt for username: ${username}`);

    if (!username || !password) {
        console.warn("[AUTH] Login failed: Missing username or password");
        return res.status(400).json({ message: "Please Provide username and password" })
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            console.warn(`[AUTH] Login failed: User "${username}" not found`);
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" })
        }

        let isPasswordCorrect = await compare(password, user.password);

        if (isPasswordCorrect) {
            let token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();
            console.log(`[AUTH] Login successful for user: ${username}`);
            return res.status(httpStatus.OK).json({ token: token })
        } else {
            console.warn(`[AUTH] Login failed: Incorrect password for user: ${username}`);
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" })
        }

    } catch (e) {
        console.error("[AUTH] Login exception occurred:", e);
        return res.status(500).json({ message: `Something went wrong: ${e.message || e}` })
    }
}


const register = async (req, res) => {
    const { name, username, password } = req.body;
    console.log(`[AUTH] Register attempt for name: ${name}, username: ${username}`);

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.warn(`[AUTH] Registration failed: Username "${username}" already exists`);
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
        }

        const hashedPassword = await hash(password, 10);

        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword
        });

        await newUser.save();
        console.log(`[AUTH] Registration successful for user: ${username}`);

        return res.status(httpStatus.CREATED).json({ message: "User Registered" })

    } catch (e) {
        console.error("[AUTH] Registration exception occurred:", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message || e}` })
    }

}


const getUserHistory = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Token is required" });
    }

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid session token" });
        }
        const meetings = await Meeting.find({ user_id: user.username })
        return res.json(meetings)
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e}` })
    }
}

const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    if (!token || !meeting_code) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Token and meeting code are required" });
    }

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid session token" });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        })

        await newMeeting.save();

        return res.status(httpStatus.CREATED).json({ message: "Added code to history" })
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e}` })
    }
}


export { login, register, getUserHistory, addToHistory }