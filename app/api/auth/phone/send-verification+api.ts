import { db } from '@/config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import axios from 'axios';

const OTPIQ_API_KEY = process.env.OTPIQ_API_KEY;
const OTPIQ_BASE_URL = 'https://api.otpiq.com/api';

// Helper function to generate a 6-digit code
function generateSixDigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    // Basic validation
    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Phone number format validation
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!OTPIQ_API_KEY) {
      console.error('Server: OTPIQ_API_KEY is not set in environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: OTPIQ API key missing' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check rate limiting
    const verificationRef = doc(db, 'phoneVerifications', phoneNumber);
    const verificationDoc = await getDoc(verificationRef);

    let attempts = 0;
    let lastAttemptAt = 0;

    if (verificationDoc.exists()) {
      const data = verificationDoc.data();
      attempts = data.attempts || 0;
      lastAttemptAt = data.lastAttemptAt?.toMillis() || 0;
    }

    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

    // Reset attempts if last attempt was more than an hour ago
    if (now - lastAttemptAt > oneHour) {
      attempts = 0;
    }

    // Rate limiting: max 3 attempts per hour
    if (attempts >= 3) {
      return new Response(
        JSON.stringify({ error: 'Too many verification attempts. Please try again after an hour.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate verification code
    const verificationCode = generateSixDigitCode();
    const expiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes from now

    // Store verification data in Firestore
    await setDoc(verificationRef, {
      code: verificationCode,
      expiresAt: expiresAt,
      attempts: attempts + 1,
      lastAttemptAt: new Date(now),
      createdAt: new Date(now),
    }, { merge: true });

    console.log('Server: Attempting to send SMS via OTPIQ API...');
    console.log('Server: OTPIQ_BASE_URL:', OTPIQ_BASE_URL);
    console.log('Server: Sending to phoneNumber:', phoneNumber);
    console.log('Server: Verification Code (for debug):', verificationCode); // Temporarily logging code for debug

    try {
      console.log('Server: Preparing axios request to OTPIQ...');
      const axiosResponse = await axios.post(
        `${OTPIQ_BASE_URL}/sms`, // Changed from /send-sms to /sms - verify this endpoint with OTPIQ docs
        {
          phoneNumber: phoneNumber,
          smsType: 'verification',
          verificationCode: verificationCode,
        },
        {
          headers: {
            'Authorization': `Bearer ${OTPIQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log('Server: OTP IQ API response status:', axiosResponse.status);
      console.log('Server: OTP IQ API response data:', axiosResponse.data);

    } catch (otpError: any) {
      console.error('Server: Error calling OTP IQ API:');
      if (otpError.response) {
        console.error('  Status:', otpError.response.status);
        console.error('  Data:', otpError.response.data);
        console.error('  Headers:', otpError.response.headers);
      } else if (otpError.request) {
        console.error('  No response received from OTPIQ. Request details:', otpError.request);
      } else {
        console.error('  Error message (request setup):', otpError.message);
      }
      console.error('  Full error object:', otpError);

      // Clean up the stored verification code if SMS sending failed
      await setDoc(verificationRef, {
        attempts: attempts, // Don't increment if SMS failed
      }, { merge: true });

      return new Response(
        JSON.stringify({ error: 'Failed to send verification code via OTPIQ. Please check server logs.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return Response.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Server error in send-verification (outer catch):', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error during verification process.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
