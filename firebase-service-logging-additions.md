# Firebase Service Logging Additions

Add these console.log statements to your `services/firebaseService.ts` file:

## In the `saveMealPlan` method:

```typescript
static async saveMealPlan(userId: string, mealPlanData: any, name: string, mealNumber: number): Promise<void> {
  try {
    console.log(`[FirebaseService] saveMealPlan called with userId: ${userId}, name: ${name}, mealNumber: ${mealNumber}`);
    
    const userDocRef = doc(db, 'users', userId);
    const savedMealPlansCollectionRef = collection(userDocRef, 'savedMealPlans');
    
    // Create new document reference
    const newMealPlanDocRef = doc(savedMealPlansCollectionRef);
    
    console.log(`[FirebaseService] Attempting to save meal plan to path: users/${userId}/savedMealPlans/${newMealPlanDocRef.id}`);
    
    const mealPlanDocument = {
      id: newMealPlanDocRef.id,
      userId,
      name,
      mealPlanData,
      generatedAt: new Date().toISOString(),
      mealNumber
    };
    
    await setDoc(newMealPlanDocRef, mealPlanDocument);
    
    console.log(`[FirebaseService] Successfully saved meal plan with ID: ${newMealPlanDocRef.id} for user ID: ${userId}`);
    console.log(`[FirebaseService] Full document path: users/${userId}/savedMealPlans/${newMealPlanDocRef.id}`);
    
  } catch (error) {
    console.error(`[FirebaseService] Error in saveMealPlan:`, error);
    throw error;
  }
}
```

## In the `getSavedMealPlans` method:

```typescript
static async getSavedMealPlans(userId: string): Promise<SavedMealPlan[]> {
  try {
    console.log(`[FirebaseService] getSavedMealPlans called for user ID: ${userId}`);
    
    const userDocRef = doc(db, 'users', userId);
    const savedMealPlansCollectionRef = collection(userDocRef, 'savedMealPlans');
    
    console.log(`[FirebaseService] Querying collection path: users/${userId}/savedMealPlans`);
    
    const q = query(savedMealPlansCollectionRef, orderBy('generatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    console.log(`[FirebaseService] Found ${querySnapshot.docs.length} documents in 'savedMealPlans' for user ID: ${userId}`);
    
    const plans: SavedMealPlan[] = [];
    querySnapshot.forEach((doc) => {
      console.log(`[FirebaseService] Retrieved meal plan document ID: ${doc.id}`);
      console.log(`[FirebaseService] Document data keys:`, Object.keys(doc.data()));
      
      plans.push({
        id: doc.id,
        ...doc.data()
      } as SavedMealPlan);
    });
    
    console.log(`[FirebaseService] Returning ${plans.length} meal plans`);
    return plans;
    
  } catch (error) {
    console.error(`[FirebaseService] Error in getSavedMealPlans:`, error);
    throw error;
  }
}
```

## In the `getMealPlanCountForDate` method:

```typescript
static async getMealPlanCountForDate(userId: string, date: string): Promise<number> {
  try {
    console.log(`[FirebaseService] getMealPlanCountForDate called for user ID: ${userId}, date: ${date}`);
    
    const plans = await this.getSavedMealPlans(userId);
    const plansForDate = plans.filter(plan => plan.generatedAt.startsWith(date));
    
    console.log(`[FirebaseService] Found ${plansForDate.length} meal plans for date ${date}`);
    
    return plansForDate.length;
  } catch (error) {
    console.error(`[FirebaseService] Error in getMealPlanCountForDate:`, error);
    throw error;
  }
}
```

---

**Instructions:**
1. Open your `services/firebaseService.ts` file
2. Find the `saveMealPlan`, `getSavedMealPlans`, and `getMealPlanCountForDate` methods
3. Add the console.log statements shown above to each method
4. Save the file
5. Test by saving a new meal plan and viewing saved meal plans
6. Check your browser console for the detailed logging output