import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { phone, message, phones } = await request.json();
    
    // Validate input
    if ((!phone && !phones) || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Process either a single phone number or an array of phone numbers
    const recipients = phones || [phone];
    const results = [];

    // Process each phone number
    for (const recipient of recipients) {
      // Strip any non-numeric characters and ensure it starts with 216 (Tunisia)
      let formattedPhone = recipient.replace(/\D/g, '');
      if (!formattedPhone.startsWith('216') && formattedPhone.length === 8) {
        formattedPhone = `216${formattedPhone}`;
      }

      // Validate Tunisian phone number format
      if (!/^216\d{8}$/.test(formattedPhone)) {
        results.push({
          phone: recipient,
          success: false,
          error: 'Invalid phone number format'
        });
        continue;
      }

      try {
        // Call WinSMS API
        // Using the official WinSMS API documentation
        // Based on the provided documentation, the API endpoint is:
        const encodedMessage = encodeURIComponent(message);
        const apiKey = process.env.WINSMS_API_KEY;
        
        // Use the exact URL format from the documentation
        // Include the sender ID which is registered as "Dar Koftan" based on your screenshot
        // URL encode the sender ID properly since it contains a space
        const senderID = encodeURIComponent('Dar Koftan');
        const url = `https://www.winsmspro.com/sms/sms/api?action=send-sms&api_key=${apiKey}&to=${formattedPhone}&from=${senderID}&sms=${encodedMessage}`;
        
        console.log('Calling WinSMS API with endpoint pattern:', 
          `https://www.winsmspro.com/sms/sms/api?action=send-sms&api_key=[HIDDEN]&to=${formattedPhone}&from=${senderID}&sms=${encodedMessage.substring(0, 10)}...`);
        
        console.log('Full URL for debugging (API key hidden):', 
          url.replace(apiKey || '', '[HIDDEN]'));
        
        // The documentation shows this is a GET request with parameters in the URL
        const response = await fetch(url, {
          method: 'GET'
        });
        const responseText = await response.text();
        
        console.log('WinSMS API response:', responseText);
        
        // WinSMS usually returns plain text responses
        const success = !responseText.toLowerCase().includes('error') && response.ok;
        
        results.push({
          phone: recipient,
          success,
          response: responseText
        });
      } catch (error) {
        console.error(`Error sending SMS to ${recipient}:`, error);
        results.push({
          phone: recipient,
          success: false,
          error: 'Failed to send SMS'
        });
      }
    }

    // Calculate overall success
    const allSuccessful = results.every(r => r.success);
    
    // Log the complete results for debugging
    console.log('SMS sending results:', JSON.stringify(results, null, 2));
    
    return NextResponse.json({
      success: allSuccessful,
      results
    });
  } catch (error) {
    console.error('Error in SMS API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
