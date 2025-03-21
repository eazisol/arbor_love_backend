export const emailTemplate = `<!-- templates/quote-confirmation-template.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote Confirmation</title>
   <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            background-color: #ffffff;
            padding: 20px;
            margin: 40px auto;
            width: 100%;
            max-width: 600px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #4CAF50;
        }
        .header h1 {
            color: #333;
            font-size: 24px;
        }
        .content {
            color: #333;
            line-height: 1.6;
            padding: 20px 0;
        }
        .content h2 {
            color: #4CAF50;
            font-size: 18px;
        }
        .quote-details {
            margin-top: 20px;
            padding: 20px;
            background-color: #f0f9f0;
            border-left: 4px solid #4CAF50;
            border-radius: 4px;
        }
        .quote-details h3 {
            font-size: 16px;
            color: #555;
            margin-top: 10px;
        }
        .quote-details img {
            max-width: 250px;
            height: auto;
            border-radius: 4px;
            margin-top: 10px;
            display: block;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
        }
        .quote-details > div {
            margin-bottom: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #4CAF50;
            color: #777;
        }
        .footer p {
            font-size: 12px;
            color: #999;
        }
        /* Media Query for mobile responsiveness */
        @media (max-width: 600px) {
            .email-container {
                width: 100%;
                padding: 10px;
                margin: 0 auto;
            }
            .header h1 {
                font-size: 22px;
            }
            .content {
                padding: 10px 0;
            }
            .quote-details {
                padding: 15px;
            }
            .footer p {
                font-size: 10px;
            }
        }
    </style>
    </head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Thank You for Requesting a Quote!</h1>
        </div>

        <div class="content">
            <p style="color:#333">Dear <strong>{{clientName}}</strong>,</p>
            <p style="color:#333">Thank you for answering all the questions. We are processing your request, and you will receive your quote within the next 24 hours. Below are the details of your request:</p>
            <div class="quote-details">
                <h2>Quote ID: {{quoteId}}</h2>
                {{#each services}}
                <div>
                    <p style="color:#333"><strong>Service Type:</strong> {{this.serviceType}}</p>
                    <p style="color:#333"><strong>Tree Location:</strong> {{this.treeLocation}}</p>
                    <p style="color:#333"><strong>Tree Height:</strong> {{this.treeHeight}}</p>
                    <p style="color:#333"><strong>Tree Type:</strong> {{this.treeType}}</p>
                    <p style="color:#333"><strong>Number of Trees:</strong> {{this.numOfTrees}}</p>
                    <p style="color:#333"><strong>Utility Lines:</strong> {{this.utilityLines}}</p>
                    <p style="color:#333"><strong>Stump Removal:</strong> {{this.stumpRemoval}}</p>
                    {{#each this.imageUrl}}
                    <img src="{{this}}" alt="Tree Image">
                    {{/each}}
                </div>
                {{/each}}
            </div>
             <p style="color:#333">Additional Info:{{additionalInfo}}</p>
            <p><strong>Date Created:</strong> {{dateCreated}}</p>
            <p style="color:#333">If you have any questions, feel free to reply to this email.</p>

        <p style="color:#333">Thank you again for trusting us with your tree trimming needs!</p>
    
        </div>

        <div class="footer">
            <p>&copy; 2024 Arbor Love. All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>
`


