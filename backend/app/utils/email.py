import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
from datetime import datetime

def send_reset_email(to_email, reset_link):
    smtp_server = current_app.config.get('SMTP_SERVER')
    smtp_port = current_app.config.get('SMTP_PORT', 587)
    smtp_username = current_app.config.get('SMTP_USERNAME')
    smtp_password = current_app.config.get('SMTP_PASSWORD')
    smtp_use_tls = current_app.config.get('SMTP_USE_TLS', True)
    default_sender = current_app.config.get('MAIL_DEFAULT_SENDER', smtp_username)

    if not smtp_server or not smtp_username or not smtp_password:
        raise ValueError(
            "SMTP configuration is missing. Please set SMTP_SERVER, "
            "SMTP_USERNAME, and SMTP_PASSWORD in your environment variables."
        )

    # Create message container
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "Reset Your CampusConnect Password"
    msg['From'] = f"CampusConnect <{default_sender}>"
    msg['To'] = to_email

    # Plain text version
    text_content = f"""Hello,

You requested a password reset for your CampusConnect account.
Please click the link below to reset your password. This link is valid for 15 minutes:

{reset_link}

If you did not request this, please ignore this email.

Best regards,
The CampusConnect Team
"""

    # HTML version (styled with CampusConnect theme: Gold & Navy)
    # Primary theme colors: Navy #0B192C, Light Navy #1E2A38, Gold #d4af37
    current_year = datetime.now().year
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your CampusConnect Password</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #040D1A;
                color: #e2e8f0;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }}
            .wrapper {{
                background-color: #040D1A;
                padding: 40px 20px;
            }}
            .container {{
                max-width: 580px;
                margin: 0 auto;
                background-color: #0B192C;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                border: 1px solid #1E2A38;
            }}
            .header {{
                background-color: #0B192C;
                padding: 30px 40px;
                text-align: center;
                border-bottom: 2px solid #d4af37;
            }}
            .header h1 {{
                color: #d4af37;
                margin: 0;
                font-size: 26px;
                font-weight: 700;
                letter-spacing: 1px;
                text-transform: uppercase;
            }}
            .content {{
                padding: 40px;
                line-height: 1.6;
                color: #b4c6ef;
                font-size: 16px;
            }}
            .content p {{
                margin: 0 0 20px 0;
            }}
            .btn-container {{
                text-align: center;
                margin: 35px 0;
            }}
            .btn {{
                background-color: #d4af37;
                color: #040D1A !important;
                text-decoration: none;
                padding: 14px 35px;
                font-weight: bold;
                font-size: 16px;
                border-radius: 8px;
                display: inline-block;
                box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
                transition: background-color 0.2s, transform 0.1s;
            }}
            .warning {{
                font-size: 13px;
                color: #f87171;
                margin-top: 30px;
                padding: 15px;
                background-color: rgba(239, 68, 68, 0.1);
                border-left: 4px solid #f87171;
                border-radius: 4px;
            }}
            .footer {{
                background-color: #060F1E;
                padding: 25px 40px;
                text-align: center;
                font-size: 12px;
                color: #64748b;
                border-top: 1px solid #1E2A38;
            }}
            .footer p {{
                margin: 5px 0;
            }}
            .link-fallback {{
                word-break: break-all;
                font-size: 13px;
                color: #d4af37;
            }}
            a {{
                color: #d4af37;
                text-decoration: none;
            }}
            a:hover {{
                text-decoration: underline;
            }}
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <h1>CampusConnect</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>You recently requested to reset the password for your CampusConnect account. Click the button below to proceed. This password reset link is valid for <strong>15 minutes</strong>.</p>
                    
                    <div class="btn-container">
                        <a href="{reset_link}" class="btn">Reset Password</a>
                    </div>
                    
                    <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
                    <p class="link-fallback"><a href="{reset_link}">{reset_link}</a></p>
                    
                    <div class="warning">
                        <strong>Security Warning:</strong> If you did not request a password reset, please ignore this email or change your password if you suspect unauthorized access.
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; {current_year} CampusConnect. All rights reserved.</p>
                    <p>Connecting campus communities securely.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    part1 = MIMEText(text_content, 'plain')
    part2 = MIMEText(html_content, 'html')

    msg.attach(part1)
    msg.attach(part2)

    # Establish SMTP connection and send email
    try:
        # Check if port suggests SSL (465) or standard TLS (587, 25)
        if smtp_port == 465 or not smtp_use_tls:
            server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(smtp_username, smtp_password)
        server.sendmail(default_sender, to_email, msg.as_string())
        server.quit()
    except Exception as e:
        raise RuntimeError(f"SMTP error occurred while sending email: {e}")
