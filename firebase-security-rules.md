# Firebase Security Rules for Food Request Feature

Add these security rules to your Firebase Firestore to protect the `foodRequests` collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Existing rules for other collections...
    
    // Food Requests Collection Rules
    match /foodRequests/{requestId} {
      // Allow users to create their own food requests
      allow create: if request.auth != null 
        && request.auth.uid == resource.data.userId
        && isValidFoodRequest(resource.data);
      
      // Allow users to read only their own food requests
      allow read: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      // Only allow admins to update food request status
      // You can modify this based on your admin role system
      allow update: if request.auth != null 
        && (
          // Allow admin users (you'll need to implement admin role checking)
          hasAdminRole(request.auth.uid)
          // OR allow the user to update only non-status fields (if needed)
          // || (request.auth.uid == resource.data.userId && !('status' in request.writeFields))
        );
      
      // Only allow admins or the request owner to delete
      allow delete: if request.auth != null 
        && (
          hasAdminRole(request.auth.uid) 
          || request.auth.uid == resource.data.userId
        );
    }
    
    // Helper function to validate food request data
    function isValidFoodRequest(data) {
      return data.keys().hasAll(['userId', 'foodName', 'status', 'createdAt'])
        && data.userId is string
        && data.foodName is string
        && data.foodName.size() > 0
        && data.foodName.size() <= 100
        && data.status is bool
        && (
          !('description' in data) 
          || (data.description is string && data.description.size() <= 500)
        );
    }
    
    // Helper function to check admin role
    // You'll need to implement this based on your admin system
    function hasAdminRole(userId) {
      // Option 1: Check a custom claims token
      // return request.auth.token.admin == true;
      
      // Option 2: Check an admin collection
      // return exists(/databases/$(database)/documents/admins/$(userId));
      
      // Option 3: Hardcode admin user IDs (not recommended for production)
      // return userId in ['admin-user-id-1', 'admin-user-id-2'];
      
      // For now, return false (only users can manage their own requests)
      return false;
    }
  }
}
```

## Implementation Notes:

### 1. **User Permissions**
- Users can **create** their own food requests
- Users can **read** only their own food requests
- Users can **delete** their own food requests (optional)

### 2. **Admin Permissions**
- Admins can **update** food request status (pending → processed)
- Admins can **delete** any food request
- You need to implement the `hasAdminRole()` function based on your admin system

### 3. **Data Validation**
- Food name is required and must be 1-100 characters
- Description is optional and must be ≤500 characters
- Status must be a boolean
- User ID must match the authenticated user

### 4. **Security Features**
- Prevents users from accessing other users' requests
- Validates data structure and content
- Prevents unauthorized status updates
- Protects against data injection attacks

### 5. **Admin Role Implementation Options**

Choose one of these approaches for admin role checking:

**Option A: Custom Claims (Recommended)**
```javascript
function hasAdminRole(userId) {
  return request.auth.token.admin == true;
}
```

**Option B: Admin Collection**
```javascript
function hasAdminRole(userId) {
  return exists(/databases/$(database)/documents/admins/$(userId));
}
```

**Option C: Hardcoded Admin IDs (Development Only)**
```javascript
function hasAdminRole(userId) {
  return userId in ['your-admin-user-id'];
}
```

### 6. **Testing the Rules**

Test these rules in the Firebase Console Rules Playground:

1. **User Creating Request**: ✅ Should work
2. **User Reading Own Request**: ✅ Should work  
3. **User Reading Other's Request**: ❌ Should fail
4. **User Updating Status**: ❌ Should fail
5. **Admin Updating Status**: ✅ Should work (if admin role implemented)