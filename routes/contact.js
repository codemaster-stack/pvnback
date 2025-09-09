// routes/contact.js
const express = require('express');
const sendEmail = require('../utils/sendEmail');
const router = express.Router();

// Handle contact form submission
router.post('/contact', async (req, res) => {
    try {
        const { subject, message } = req.body;
        
        // Validate input
        if (!subject || !message) {
            return res.status(400).json({
                status: 'error',
                message: 'Subject and message are required'
            });
        }

        // Email options
        const emailOptions = {
            email: 'johnlegendry2@gmail.com', // Your admin email
            subject: `Contact Form: ${subject}`,
            message: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                        New Contact Form Message
                    </h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
                        <p style="margin: 0;"><strong>Message:</strong></p>
                        <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    
                    <hr style="border: none; height: 1px; background: #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        This message was sent from the PVNB website contact form<br>
                        Time: ${new Date().toLocaleString()}
                    </p>
                </div>
            `
        };

        // Send email using your existing function
        await sendEmail(emailOptions);
        
        res.json({
            status: 'success',
            message: 'Your message has been sent successfully! We will get back to you soon.'
        });
        
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to send message. Please try again later.'
        });
    }
});

module.exports = router;