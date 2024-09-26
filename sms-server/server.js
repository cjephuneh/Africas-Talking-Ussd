const express = require("express");
const AfricasTalking = require('africastalking');
require('dotenv').config();

// Initialize Africa's Talking
const africastalking = AfricasTalking({
    apiKey: process.env.API_KEY, // Ensure this is correct
    username: 'your_username' // Ensure this is correct
});

// Create an instance of the express application
const PORT = process.env.PORT || 8080;
const app = express();

// Parse JSON bodies
app.use(express.json({ limit: '10kb' }));

// Define the route for sending the SMS
app.post('/send-sms', async (req, res) => {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
        return res.status(400).send("Phone Number and Message are required");
    }

    try {
        // Send the message
        const result = await africastalking.SMS.send({
            to: phoneNumber,
            message: message
        });

        console.log(result);
        res.status(200).json({
            status: "success",
            data: {
                result
            }
        });
    } catch (error) {
        console.error("Error", error);
        res.status(500).send("An error occurred while sending SMS");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});