const express = require('express');
const sendEmail = require('../utils/sendEmail');
const ContactMessage = require('../models/Contact');
const router = express.Router();

// Handle contact form submission
router.post('/contactbymail', async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null; // Handle logged-in & guest users
        const {  subject, message } = req.body;

        // Validate required fields
        if (!subject || !message) {
            return res.status(400).json({
                status: 'error',
                message: 'Subject and message are required'
            });
        }

        // Save message to DB
        const newMessage = new ContactMessage({
            userId: userId || undefined, // 
            subject,
            message
        });

        await newMessage.save();

        // Prepare email for admin
        const emailOptions = {
            email: 'johnlegendry2@gmail.com', // Admin email
            subject: `Contact Form: ${subject}`,
            message: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                        New Contact Form Message
                    </h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>From:</strong> ${email || 'Not provided'}</p>
                        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Message:</strong></p>
                        <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    
                    <hr style="border: none; height: 1px; background: #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        Sent from PVNB Contact Form <br>
                        Time: ${new Date().toLocaleString()}
                    </p>
                </div>
            `
        };

        // Send email notification
        await sendEmail(emailOptions);

        return res.status(200).json({
            status: 'success',
            message: 'Your message has been sent successfully and saved in our system!'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to send your message. Please try again later.'
        });
    }
});

module.exports = router;
