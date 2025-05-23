require('dotenv').config();
const nodemailer = require('nodemailer');

// Email service providers
const providers = {
  SMTP: 'smtp',
  SENDGRID: 'sendgrid',
  MAILGUN: 'mailgun',
  AWS_SES: 'ses',
};

// Default provider
const defaultProvider = process.env.EMAIL_PROVIDER || providers.SMTP;

// SMTP configuration
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
};

// Create transporter based on provider
let transporter;

switch (defaultProvider) {
  case providers.SENDGRID:
    // Sendgrid configuration
    transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_API_USER,
        pass: process.env.SENDGRID_API_KEY,
      },
    });
    break;
  
  case providers.MAILGUN:
    // Mailgun configuration
    transporter = nodemailer.createTransport({
      service: 'Mailgun',
      auth: {
        user: process.env.MAILGUN_USER,
        pass: process.env.MAILGUN_API_KEY,
      },
    });
    break;
  
  case providers.AWS_SES:
    // AWS SES configuration
    transporter = nodemailer.createTransport({
      SES: { 
        accessKeyId: process.env.AWS_SES_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SES_SECRET_KEY,
        region: process.env.AWS_SES_REGION || 'us-east-1',
      }
    });
    break;
  
  case providers.SMTP:
  default:
    // SMTP configuration (default)
    transporter = nodemailer.createTransport(smtpConfig);
    break;
}

// Default email options
const defaultMailOptions = {
  from: process.env.EMAIL_FROM || 'no-reply@portfolioapp.com',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@portfolioapp.com',
};

// Template paths
const templatePaths = {
  welcome: 'welcome',
  passwordReset: 'password-reset',
  emailVerification: 'email-verification',
  invoice: 'invoice',
  notification: 'notification',
};

module.exports = {
  transporter,
  defaultMailOptions,
  templatePaths,
  providers,
  
  // Send an email
  sendMail: async (options) => {
    try {
      const mailOptions = {
        ...defaultMailOptions,
        ...options,
      };
      
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  },
  
  // Verify connection
  verifyConnection: async () => {
    return await transporter.verify();
  },
}; 