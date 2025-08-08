import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();

const db = admin.firestore();

// Define the secret
const otpiqApiKey = defineSecret('OTPIQ_API_KEY');

export const sendVerificationCode = functions.https.onRequest(
  { secrets: [otpiqApiKey] },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { phoneNumber } = request.body;

      if (!phoneNumber) {
        response.status(400).json({ error: 'Phone number is required' });
        return;
      }

      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phoneNumber)) {
        response.status(400).json({ error: 'Invalid phone number format' });
        return;
      }

      // Get the API key from the secret
      const OTPIQ_API_KEY = otpiqApiKey.value();
      if (!OTPIQ_API_KEY) {
        functions.logger.error("OTPIQ_API_KEY is not set in Firebase Functions config.");
        response.status(500).json({ error: 'Server configuration error: OTPIQ API key missing' });
        return;
      }

      const OTPIQ_BASE_URL = 'https://api.otpiq.com/api';

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const verificationRef = db.collection('phoneVerifications').doc(phoneNumber);
      const verificationDoc = await verificationRef.get();

      let attempts = 0;
      let lastAttemptAt = 0;

      if (verificationDoc.exists) {
        const data = verificationDoc.data();
        attempts = data?.attempts || 0;
        lastAttemptAt = data?.lastAttemptAt?.toMillis() || 0;
      }

      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (now - lastAttemptAt > oneHour) {
        attempts = 0;
      }

      if (attempts >= 5) {
        response.status(429).json({ error: 'Too many verification attempts. Please try again after an hour.' });
        return;
      }

      await verificationRef.set({
        code: verificationCode,
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        attempts: attempts + 1,
        lastAttemptAt: admin.firestore.Timestamp.fromDate(new Date(now)),
        createdAt: admin.firestore.Timestamp.fromDate(new Date(now)),
      }, { merge: true });

      try {
        await axios.post(
          `${OTPIQ_BASE_URL}/sms`,
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
            timeout: 10000,
          }
        );
      } catch (otpError: any) {
        functions.logger.error("Error calling OTPIQ API:", otpError.response?.data || otpError.message);
        response.status(500).json({ error: 'Failed to send verification code via OTPIQ.' });
        return;
      }

      response.status(200).json({
        success: true,
        message: 'Verification code sent successfully',
        expiresIn: 600,
      });

    } catch (error) {
      functions.logger.error("Error in sendVerificationCode function:", error);
      response.status(500).json({ error: 'Internal server error' });
    }
  }
);

export const verifyPhoneCode = functions.https.onRequest(async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).send('Method Not Allowed');
    return;
    }

    try {
    const { phoneNumber, code } = request.body;

    // Basic validation
      if (!phoneNumber || !code) {
      response.status(400).json({ error: 'Phone number and verification code are required' });
      return;
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      response.status(400).json({ error: 'Verification code must be 6 digits' });
      return;
    }

    // Get verification data from Firestore
    const verificationRef = db.collection('phoneVerifications').doc(phoneNumber);
      const verificationDoc = await verificationRef.get();

      if (!verificationDoc.exists) {
      response.status(400).json({ error: 'No verification code found for this phone number' });
      return;
      }

      const data = verificationDoc.data();
      if (!data) {
      response.status(400).json({ error: 'Invalid verification data' });
      return;
      }

      const storedCode = data.code;
    const expiresAt = data.expiresAt?.toMillis();
    const now = Date.now();

    // Check if code has expired
    if (now > expiresAt) {
      // Clean up expired code
      await verificationRef.delete();
      response.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
      return;
    }

    // Check if code matches
    if (code !== storedCode) {
      response.status(400).json({ error: 'Invalid verification code' });
      return;
    }

    // Mark as verified
    await verificationRef.set({
      verified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // ADD THIS: Send success response
    response.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      phoneNumber: phoneNumber
    });

  } catch (error) {
    functions.logger.error('Error in verifyPhoneCode function:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});
  export const checkPhoneExists = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { phoneNumber } = request.body;

      // Basic validation
      if (!phoneNumber) {
        response.status(400).json({ error: 'Phone number is required' });
        return;
      }
  
      // Phone number format validation
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phoneNumber)) {
        response.status(400).json({ error: 'Invalid phone number format' });
        return;
      }
  
      // Query the 'users' collection to check if a user with this phone number exists
      const usersRef = db.collection('users');
      const querySnapshot = await usersRef.where('phoneNumber', '==', phoneNumber).get();
      
      const exists = !querySnapshot.empty;
  
      response.status(200).json({
        success: true,
        exists: exists,
        phoneNumber: phoneNumber,
        message: exists 
          ? 'Phone number is already registered' 
          : 'Phone number is available for registration',
      });
  
    } catch (error) {
      functions.logger.error('Error in checkPhoneExists function:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  });
  // Add this to your functions/src/index.ts file

export const resetPasswordRequest = functions.https.onRequest(
    { secrets: [otpiqApiKey] },
  async (request, response) => {
      if (request.method !== 'POST') {
        response.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const { phoneNumber } = request.body;
  
        if (!phoneNumber) {
          response.status(400).json({ error: 'Phone number is required' });
          return;
        }
  
        // 1. Check if the phone number exists in your user database
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('phoneNumber', '==', phoneNumber).get();
  
        if (querySnapshot.empty) {
          response.status(404).json({ error: 'Phone number not registered.' });
          return;
        }
  
        // Get the API key from the secret
        const OTPIQ_API_KEY = otpiqApiKey.value();
        if (!OTPIQ_API_KEY) {
          functions.logger.error("OTPIQ_API_KEY is not set in Firebase Functions config.");
          response.status(500).json({ error: 'Server configuration error: OTPIQ API key missing' });
          return;
        }
  
        const OTPIQ_BASE_URL = 'https://api.otpiq.com/api';
  
        // 2. Implement rate limiting for verification code requests
        const verificationRef = db.collection('phoneVerifications').doc(phoneNumber);
        const verificationDoc = await verificationRef.get();
  
        let attempts = 0;
        let lastAttemptAt = 0;
  
        if (verificationDoc.exists) {
          const data = verificationDoc.data();
          if (data) {
            attempts = data.attempts || 0;
            lastAttemptAt = data.lastAttemptAt?.toMillis() || 0;
          }
        }
  
        const now = Date.now();
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  
        if (now - lastAttemptAt > oneHour) {
          attempts = 0; // Reset attempts if last attempt was more than an hour ago
        }
  
        // Rate limiting: max 5 attempts per hour (increased from 3)
        if (attempts >= 5) {
          response.status(429).json({ 
            error: 'Too many verification attempts. Please try again after an hour.' 
          });
          return;
        }
  
        // 3. Generate and store verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(now + 10 * 60 * 1000); // Code valid for 10 minutes
  
        await verificationRef.set({
          code: verificationCode,
          expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
          attempts: attempts + 1,
          lastAttemptAt: admin.firestore.Timestamp.fromDate(new Date(now)),
          createdAt: admin.firestore.Timestamp.fromDate(new Date(now)),
          purpose: 'password_reset', // Mark the purpose of this code
        }, { merge: true });
  
        // 4. Send SMS via OTPIQ API
        try {
          await axios.post(
            `${OTPIQ_BASE_URL}/sms`,
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
              timeout: 10000,
            }
          );
  
          functions.logger.info("Password reset code sent successfully", { phoneNumber });
  
        } catch (otpError: unknown) {
          functions.logger.error(
            "Error calling OTPIQ API for password reset:",
            (otpError as {response?: {data?: unknown; status?: number}; message?: string})
              .response?.data ||
            (otpError as {message?: string}).message
          );
  
          // Revert attempt count if SMS sending failed
          await verificationRef.set({ attempts: attempts }, { merge: true });
          
          response.status(500).json({ 
            error: 'Failed to send verification code. Please try again.' 
          });
          return;
        }
  
        response.status(200).json({
          success: true,
          message: 'Verification code sent successfully',
          expiresIn: 600, // 10 minutes in seconds
        });
  
      } catch (error) {
        functions.logger.error('Error in resetPasswordRequest function:', error);
        response.status(500).json({ 
          error: 'Internal server error during password reset request.' 
        });
      }
    }
  );
  
  // Optional: Also create a verify password reset code function
  export const verifyPasswordResetCode = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { phoneNumber, code } = request.body;
  
      if (!phoneNumber || !code) {
        response.status(400).json({ error: 'Phone number and code are required' });
        return;
      }
  
      // Validate code format (6 digits)
      if (!/^\d{6}$/.test(code)) {
        response.status(400).json({ error: 'Verification code must be 6 digits' });
        return;
      }
  
      // Get verification data from Firestore
      const verificationRef = db.collection('phoneVerifications').doc(phoneNumber);
      const verificationDoc = await verificationRef.get();
  
      if (!verificationDoc.exists) {
        response.status(400).json({ error: 'No verification code found for this phone number' });
        return;
      }
  
      const data = verificationDoc.data();
      if (!data) {
        response.status(400).json({ error: 'Invalid verification data' });
        return;
      }
  
      const storedCode = data.code;
      const expiresAt = data.expiresAt?.toMillis();
      const purpose = data.purpose;
      const now = Date.now();
  
      // Check if this is a password reset code
      if (purpose !== 'password_reset') {
        response.status(400).json({ error: 'Invalid verification code type' });
        return;
      }
  
      // Check if code has expired
      if (now > expiresAt) {
        // Clean up expired code
        await verificationRef.delete();
        response.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
        return;
      }
  
      // Check if code matches
      if (code !== storedCode) {
        response.status(400).json({ error: 'Invalid verification code' });
        return;
      }
  
      // Code is valid, but don't delete it yet - keep it for the actual password reset
      // You might want to mark it as "verified" instead
      await verificationRef.set({
        verified: true,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
  
      response.status(200).json({
        success: true,
        message: 'Verification code is valid',
        phoneNumber: phoneNumber,
        // You might want to return a temporary token here for the next step
      });
  
    } catch (error) {
      functions.logger.error('Error in verifyPasswordResetCode function:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  });
  // Add this to your functions/src/index.ts file

  export const resetPasswordConfirm = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { phoneNumber, newPassword } = request.body; // Only need these two
  
      if (!phoneNumber || !newPassword) {
        response.status(400).json({ 
          error: 'Phone number and new password are required' 
        });
        return;
      }
  
      if (newPassword.length < 6) {
        response.status(400).json({ 
          error: 'New password must be at least 6 characters long' 
        });
        return;
      }
  
      // Check if phone was previously verified for password reset
      const verificationRef = db.collection('phoneVerifications').doc(phoneNumber);
      const verificationDoc = await verificationRef.get();
  
      if (!verificationDoc.exists) {
        response.status(400).json({ error: 'No verification found for this phone number' });
        return;
      }
  
      const data = verificationDoc.data();
      if (!data) {
        response.status(400).json({ error: 'Invalid verification data' });
        return;
      }
  
      const purpose = data.purpose;
      const verified = data.verified;
      const expiresAt = data.expiresAt?.toMillis();
      const now = Date.now();
  
      // Check if this is a password reset verification
      if (purpose !== 'password_reset') {
        response.status(400).json({ error: 'Invalid verification type' });
        return;
      }
  
      // Check if verification has expired
      if (now > expiresAt) {
        await verificationRef.delete();
        response.status(400).json({ error: 'Verification has expired. Please request a new code.' });
        return;
      }
  
      // Check if phone number was verified in Step 2
      if (!verified) {
        response.status(400).json({ error: 'Phone number not verified. Please verify your code first.' });
        return;
      }
  
      // Find the user by phone number
      let userRecord;
      try {
        // First, find the user in Firestore to get their UID
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('phoneNumber', '==', phoneNumber).get();
  
        if (querySnapshot.empty) {
          response.status(404).json({ error: 'User not found for this phone number.' });
          return;
        }
  
        // Get the first matching user
        const userDoc = querySnapshot.docs[0];
        const userId = userDoc.id;
  
        // Get the user record from Firebase Auth
        userRecord = await admin.auth().getUser(userId);
  
      } catch (error: any) {
        functions.logger.error('Error getting user by phone number:', error);
        
        if (error.code === 'auth/user-not-found') {
          response.status(404).json({ error: 'User not found for this phone number.' });
          return;
        }
        
        response.status(500).json({ error: 'Failed to retrieve user information.' });
        return;
      }
  
      try {
        // Update the user's password using Firebase Admin Auth
        await admin.auth().updateUser(userRecord.uid, {
          password: newPassword,
        });
  
        functions.logger.info('Password updated successfully for user:', { 
          uid: userRecord.uid, 
          phoneNumber 
        });
  
      } catch (updateError: any) {
        functions.logger.error('Error updating user password:', updateError);
        response.status(500).json({ error: 'Failed to update password.' });
        return;
      }
  
      // Clean up the verification document
      try {
        await verificationRef.delete();
        functions.logger.info('Verification document cleaned up for:', phoneNumber);
      } catch (deleteError) {
        functions.logger.warn('Could not delete verification doc:', deleteError);
        // Don't fail the request if cleanup fails
      }
  
      response.status(200).json({
        success: true,
        message: 'Password updated successfully.',
      });
  
    } catch (error) {
      functions.logger.error('Error in resetPasswordConfirm function:', error);
      response.status(500).json({ 
        error: 'Internal server error during password reset confirmation.' 
      });
    }
  });
  
  // Optional: Separate function to just verify the reset code without changing password
  export const verifyPasswordResetToken = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { phoneNumber, verificationCode } = request.body;
  
      if (!phoneNumber || !verificationCode) {
        response.status(400).json({ error: 'Phone number and verification code are required' });
        return;
      }
  
      const verificationRef = db.collection('phoneVerifications').doc(phoneNumber);
      const verificationDoc = await verificationRef.get();
  
      if (!verificationDoc.exists) {
        response.status(400).json({ error: 'No verification found for this phone number' });
        return;
      }
  
      const data = verificationDoc.data();
      if (!data) {
        response.status(400).json({ error: 'Invalid verification data' });
        return;
      }
  
      const storedCode = data.code;
      const expiresAt = data.expiresAt?.toMillis();
      const purpose = data.purpose;
      const now = Date.now();
  
      // Check if this is a password reset code
      if (purpose !== 'password_reset') {
        response.status(400).json({ error: 'Invalid verification code type' });
        return;
      }
  
      // Check if code has expired
      if (now > expiresAt) {
        await verificationRef.delete();
        response.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
        return;
      }
  
      // Check if code matches
      if (verificationCode !== storedCode) {
        response.status(400).json({ error: 'Invalid verification code' });
        return;
      }
  
      // Mark as verified for future use
      await verificationRef.set({
        verified: true,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
  
      // Generate a temporary reset token (valid for 15 minutes)
      const resetToken = admin.auth().createCustomToken(phoneNumber, { 
        purpose: 'password_reset',
        expiresIn: 15 * 60 * 1000 // 15 minutes
      });
  
      response.status(200).json({
        success: true,
        message: 'Verification code is valid',
        resetToken: await resetToken, // You can use this token to authorize the password change
        expiresIn: 900 // 15 minutes in seconds
      });
  
    } catch (error) {
      functions.logger.error('Error in verifyPasswordResetToken function:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  });


// Add this function after existing functions:
export const sendWeeklyReportNotifications = functions.scheduler
  .onSchedule({
    schedule: '0 8 * * 5',
    timeZone: 'UTC'
  }, async (event) => {
    try {
      console.log('📱 Starting weekly report notifications...');
      
      // Get all users
      const usersSnapshot = await admin.firestore().collection('users').get();
      const users = usersSnapshot.docs;
      
      console.log(`📱 Found ${users.length} users to notify`);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process users in batches to avoid rate limits
      const batchSize = 50;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        const promises = batch.map(async (userDoc) => {
          try {
            const userData = userDoc.data();
            const pushToken = userData.pushToken;
            
            if (!pushToken) {
              console.log(`📱 No push token for user ${userDoc.id}`);
              return;
            }
            
            // Send notification
            const message = {
              to: pushToken,
              sound: 'default',
              title: '📊 Your Weekly Report is Ready!',
              body: 'Generate your nutrition summary for the previous week and track your progress.',
              data: {
                type: 'weekly_report_ready',
                action: 'open_stats'
              },
              badge: 1
            };
            
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(message),
            });
            
            const result = await response.json() as { data?: { status?: string } };
            
            if (result.data && result.data.status === 'ok') {
              console.log(`📱 Weekly report notification sent to user ${userDoc.id}`);
              successCount++;
            } else {
              console.error(`📱 Failed to send notification to user ${userDoc.id}:`, result);
              errorCount++;
            }
          } catch (error) {
            console.error(`📱 Error sending notification to user ${userDoc.id}:`, error);
            errorCount++;
          }
        });
        
        await Promise.all(promises);
        
        // Add delay between batches to avoid rate limits
        if (i + batchSize < users.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`📱 Weekly report notifications completed. Success: ${successCount}, Errors: ${errorCount}`);
      
    } catch (error) {
      console.error('📱 Error in weekly report notifications:', error);
      throw error;
    }
  });