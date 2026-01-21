//new
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    // Create a transporter
    // Use environment variables for SMTP config
    // Example .env: SMTP_HOST, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io', // Default or placeholder
        port: process.env.SMTP_PORT || 2525,
        auth: {
            user: process.env.SMTP_EMAIL || 'user',
            pass: process.env.SMTP_PASSWORD || 'pass'
        }
    });

    // Define email options
    const mailOptions = {
        from: `${process.env.FROM_NAME || 'Quick X POS'} <${process.env.FROM_EMAIL || 'noreply@quickxpos.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: options.html // You can add HTML template support later
    };

    // If no real credentials, just log it for dev
    if (!process.env.SMTP_HOST && !process.env.SMTP_EMAIL) {
        console.log('----------------------------------------------------');
        console.log(`[EMAIL SIMULATION] To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('----------------------------------------------------');
        return;
    }

    // Send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
//end