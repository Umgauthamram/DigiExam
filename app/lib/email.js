import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({ to, subject, html }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials not configured. Skipping email send:", subject);
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"DigiExam Secure Core" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

export function buildResultEmailHtml(examTitle, score, total, violations) {
    return `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #4b0082;">DigiExam Result Notification</h2>
            <p>Your recent attempt for the exam <strong>${examTitle}</strong> has been successfully securely recorded and immutably stored on the blockchain.</p>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Score:</strong> ${score} / ${total}</p>
                <p><strong>Violations Recorded:</strong> ${violations > 0 ? `<span style="color: red;">${violations} Warnings</span>` : '<span style="color: green;">None (Clean Profile)</span>'}</p>
            </div>
            <p>Log in to your dashboard for detailed analytics and feedback breakdown.</p>
        </div>
    `;
}
