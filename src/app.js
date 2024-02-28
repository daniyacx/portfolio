const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'aubakirovadania@gmail.com',
        pass: 'bgngujfnctixojsy'
    }
});

// Function to send welcome message
const sendWelcomeEmail = (userEmail) => {
    const mailOptions = {
        from: 'aubakirovadania@gmail.com',
        to: userEmail,
        subject: 'Welcome to Our Website!',
        text: 'Welcome to our website! We are excited to have you on board.'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending welcome email:', error);
        } else {
            console.log('Welcome email sent:', info.response);
        }
    });
};

// Export the sendWelcomeEmail function
module.exports.sendWelcomeEmail = sendWelcomeEmail;