import { db } from '@/config/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { phoneNumber, code } = await request.json();

    // Basic validation
    if (!phoneNumber || !code) {
      return new Response(
        JSON.stringify({ error: 'Phone number and verification code are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: 'Verification code must be 6 digits' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get verification data from Firestore
    const verificationRef = doc(db, 'phoneVerifications', phoneNumber);
    const verificationDoc = await getDoc(verificationRef);

    if (!verificationDoc.exists()) {
      return new Response(
        JSON.stringify({ error: 'No verification code found for this phone number' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const data = verificationDoc.data();
    const storedCode = data.code;
    const expiresAt = data.expiresAt?.toMillis();

    const now = Date.now();

    // Check if code has expired
    if (now > expiresAt) {
      // Clean up expired code
      await deleteDoc(verificationRef);
      return new Response(
        JSON.stringify({ error: 'Verification code has expired. Please request a new one.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if code matches
    if (code !== storedCode) {
      return new Response(
        JSON.stringify({ error: 'Invalid verification code' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Code is valid, delete it to prevent reuse
    await deleteDoc(verificationRef);

    return Response.json({
      success: true,
      message: 'Phone number verified successfully',
      phoneNumber: phoneNumber,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Server error in verify-code:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}