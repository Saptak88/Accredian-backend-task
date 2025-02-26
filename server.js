import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();
const app = express();
const prisma = process.env.NODE_ENV !== "production" ? new PrismaClient() : null;

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
        user: "testuser",
        pass: "testpass",
    },
});

const sendReferralEmail = async (referral) => {
    const mailOptions = {
        from: "testuser",
        to: referral.email, // Send email to the referred person
        subject: "You've Been Referred!",
        text: `Hi ${referral.name},\n\nYou've been referred by ${referral.referredBy}!`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Referral email sent successfully");
    } catch (error) {
        console.log("Error sending email:", error);
    }
};

// Save referral data
app.post("/api/newReferral", async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const referredBy = "test@test.com";
        // console.log(req.body);

        if (!name || !email || !referredBy) {
            return res.status(400).json({ error: "Name, email, and referrer are required." });
        }

        // Skip database interaction in production since no free MySQL cloud service is available
        if (process.env.NODE_ENV === "production") {
            console.log("Referral received.");
            return res.status(201).json({ message: "Referral received (DB skipped in production)." });
        }

        const newReferral = await prisma.referral.create({
            data: { name, email, phone, referredBy },
        });

        res.status(201).send("Referral created successfully");

        // Send email asynchronously (doesn't block response)
        // console.log(newReferral);
        // setImmediate(() => sendReferralEmail(newReferral));
    } catch (error) {
        res.status(500).json({ error: "Failed to save referral." });
    }
});

// Get all referrals
// app.post("/api/referrals", async (req, res) => {
//     try {
//         const referrals = await prisma.referral.findMany();
//         res.json(referrals);
//     } catch (error) {
//         res.status(500).json({ error: "Failed to fetch referrals." });
//     }
// });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
