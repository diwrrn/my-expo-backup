import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export class PDFService {
  static async generateWeeklyReport(
    reportData: any, 
    userName: string = 'User',
    dailyCalorieGoal?: number
  ): Promise<void> {
    try {
      console.log('📄 PDFService: Starting PDF generation for:', userName);
      
      // Create HTML template with updated design
      const htmlContent = this.createWeeklyReportHTML(reportData, userName, dailyCalorieGoal);
      
      console.log('📄 PDFService: HTML content length:', htmlContent.length);
      
      // Generate PDF using expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 612,
        height: 792,
        margins: {
          left: 40,
          top: 40,
          right: 40,
          bottom: 40,
        }
      });
      
      console.log('✅ PDFService: PDF generated successfully:', uri);
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${userName}'s Weekly Nutrition Report`
        });
        console.log('✅ PDFService: PDF shared successfully');
      } else {
        console.log('⚠️ PDFService: Sharing not available on this device');
      }
      
    } catch (error) {
      console.error('❌ PDFService error:', error);
      throw error;
    }
  }
  
  private static createWeeklyReportHTML(reportData: any, userName: string, dailyCalorieGoal?: number): string {
    const calorieGoal = dailyCalorieGoal || 2200;
    
    // Category icons mapping
    const categoryIcons = {
      proteins: '🥩',
      vegetables: '🥕', 
      grains: '🌾',
      fruits: '🍎',
      dairy: '🥛'
    };

    // Calculate daily percentages for goal tracking
    const dailyPercentages = Object.entries(reportData.dailyCalories).map(([day, calories]) => ({
      day,
      calories: calories as number,
      percentage: Math.round((calories as number / calorieGoal) * 100)
    }));

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Weekly Nutrition Report</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1A1A1A;
              background: #FAFAFA;
              font-size: 14px;
            }
            
            .container {
              max-width: 100%;
              margin: 0;
              background: #FFFFFF;
              min-height: 100vh;
            }
            
            .header {
              background: #FFFFFF;
              padding: 30px 40px;
              border-bottom: 1px solid #F0F0F0;
            }
            
            .title {
              font-size: 32px;
              font-weight: 700;
              color: #1A1A1A;
              margin-bottom: 16px;
              text-align: left;
            }
            
            .header-info {
              margin-top: 12px;
            }
            
            .header-label {
              font-size: 16px;
              color: #6B7280;
              font-weight: 500;
              margin-bottom: 4px;
              display: block;
            }
            
            .header-value {
              color: #1A1A1A;
              font-weight: 600;
            }
            
            .content {
              padding: 0 40px;
            }
            
            .stats-section {
              background: #FFFFFF;
              padding: 30px 0;
              margin-bottom: 20px;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }
            
            .stat-card {
              text-align: center;
              padding: 24px 16px;
              background: #F8FDF9;
              border-radius: 12px;
              border: 1px solid #E8F5E8;
              position: relative;
            }
            
            .stat-icon {
              width: 36px;
              height: 36px;
              border-radius: 18px;
              background: #FFFFFF;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px;
              box-shadow: 0 1px 3px rgba(76, 175, 80, 0.2);
            }
            
            .stat-value {
              font-size: 28px;
              font-weight: 700;
              color: #1A1A1A;
              margin-bottom: 6px;
            }
            
            .stat-label {
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 4px;
            }
            
            .stat-subtitle {
              font-size: 12px;
              color: #9CA3AF;
              font-weight: 500;
            }
            
            .section {
              background: #FFFFFF;
              margin-bottom: 20px;
              padding: 24px 0;
            }
            
            .section-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 24px;
            }
            
            .section-title {
              font-size: 24px;
              font-weight: 700;
              color: #1A1A1A;
            }
            
            .target-info {
              background: #F3F4F6;
              padding: 8px 12px;
              border-radius: 6px;
            }
            
            .target-text {
              font-size: 12px;
              color: #6B7280;
              font-weight: 500;
            }
            
            .category-card {
              padding: 24px;
              background: #FAFAFA;
              border-radius: 12px;
              margin-bottom: 16px;
              border: 1px solid #F0F0F0;
            }
            
            .category-header {
              margin-bottom: 16px;
            }
            
            .category-title-row {
              display: flex;
              align-items: center;
            }
            
            .category-icon {
              font-size: 32px;
              margin-right: 16px;
            }
            
            .category-name {
              font-size: 20px;
              font-weight: 700;
              color: #1A1A1A;
              flex: 1;
            }
            
            .items-badge {
              background: #E8F5E8;
              padding: 8px 16px;
              border-radius: 16px;
              border: 1px solid #4CAF50;
            }
            
            .items-count {
              font-size: 14px;
              font-weight: 700;
              color: #4CAF50;
            }
            
            .category-description {
              font-size: 16px;
              color: #6B7280;
              font-weight: 500;
              margin-bottom: 20px;
              line-height: 1.5;
            }
            
            .calories-summary {
              text-align: center;
              background: #F8FDF9;
              padding: 16px;
              border-radius: 8px;
              border: 1px solid #E8F5E8;
            }
            
            .total-calories {
              font-size: 28px;
              font-weight: 900;
              color: #4CAF50;
              margin-bottom: 4px;
            }
            
            .calories-unit {
              font-size: 14px;
              color: #6B7280;
              font-weight: 600;
            }
            
            .daily-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
            }
            
            .day-card {
              background: #FAFAFA;
              border-radius: 8px;
              padding: 16px;
              border: 1px solid #F0F0F0;
            }
            
            .day-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
            }
            
            .day-name {
              font-size: 14px;
              font-weight: 600;
              color: #6B7280;
            }
            
            .day-percentage {
              font-size: 12px;
              font-weight: 600;
              color: #4CAF50;
            }
            
            .day-calories {
              font-size: 18px;
              font-weight: 700;
              color: #1A1A1A;
              margin-bottom: 12px;
            }
            
            .day-progress {
              width: 100%;
              height: 4px;
              background: #E5E7EB;
              border-radius: 2px;
              overflow: hidden;
            }
            
            .day-progress-fill {
              height: 100%;
              background: #4CAF50;
              border-radius: 2px;
              transition: width 0.3s ease;
            }
            
            .summary-section {
              padding: 24px 0;
            }
            
            .summary-card {
              background: #FFFFFF;
              border-radius: 12px;
              padding: 24px;
              border: 1px solid #F0F0F0;
            }
            
            .summary-header {
              display: flex;
              align-items: center;
              margin-bottom: 16px;
            }
            
            .summary-title {
              font-size: 18px;
              font-weight: 600;
              color: #1A1A1A;
              margin-left: 12px;
            }
            
            .summary-text {
              font-size: 15px;
              color: #6B7280;
              line-height: 1.6;
              margin-bottom: 20px;
            }
            
            .footer {
              text-align: center;
              padding: 40px;
              color: #9CA3AF;
              font-size: 12px;
              border-top: 1px solid #F0F0F0;
              background: #FAFAFA;
            }
            
            @media print {
              .container {
                background: white;
              }
              
              .section {
                page-break-inside: avoid;
              }
              
              .category-card {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1 class="title">Weekly Report</h1>
              <div class="header-info">
                <span class="header-label">Name: <span class="header-value">${userName}</span></span>
                <span class="header-label">From: <span class="header-value">${reportData.weekStart}</span></span>
                <span class="header-label">To: <span class="header-value">${reportData.weekEnd}</span></span>
              </div>
            </div>

            <div class="content">
              <!-- Summary Stats -->
              <div class="stats-section">
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-icon">🎯</div>
                    <div class="stat-value">${reportData.overallAverageCaloriesPerDay.toLocaleString()}</div>
                    <div class="stat-label">Daily Average</div>
                    <div class="stat-subtitle">calories</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-value">${reportData.daysWithData}</div>
                    <div class="stat-label">Days Tracked</div>
                    <div class="stat-subtitle">of 7 days</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${Object.keys(reportData.foodCountsPerCategory).length}</div>
                    <div class="stat-label">Food Groups</div>
                    <div class="stat-subtitle">tracked</div>
                  </div>
                </div>
              </div>

              <!-- Food Categories -->
              <div class="section">
                <div class="section-header">
                  <h2 class="section-title">Food Categories</h2>
                </div>
                
                ${Object.entries(reportData.foodCountsPerCategory).map(([category, count]) => {
                  const avgCalories = reportData.averageCaloriesPerCategory[category];
                  const weeklyCalories = avgCalories * 7;
                  
                  return `
                    <div class="category-card">
                      <div class="category-header">
                        <div class="category-title-row">
                          <span class="category-icon">${categoryIcons[category] || '🍽️'}</span>
                          <span class="category-name">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                          <div class="items-badge">
                            <span class="items-count">${count}</span>
                          </div>
                        </div>
                      </div>
                      <div class="category-description">
                        You have eaten ${category} ${count} times during this week
                      </div>
                      <div class="calories-summary">
                        <div class="total-calories">${weeklyCalories.toLocaleString()}</div>
                        <div class="calories-unit">total calories</div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Daily Breakdown -->
              <div class="section">
                <div class="section-header">
                  <h2 class="section-title">Daily Breakdown</h2>
                  <div class="target-info">
                    <span class="target-text">Target: ${calorieGoal.toLocaleString()} cal</span>
                  </div>
                </div>
                
                <div class="daily-grid">
                  ${dailyPercentages.map(({ day, calories, percentage }) => {
                    const maxCalories = Math.max(...Object.values(reportData.dailyCalories) as number[]);
                    const progress = Math.min((calories / maxCalories) * 100, 100);
                    
                    return `
                      <div class="day-card">
                        <div class="day-header">
                          <span class="day-name">${day}</span>
                          <span class="day-percentage">${percentage}%</span>
                        </div>
                        <div class="day-calories">${calories.toLocaleString()}</div>
                        <div class="day-progress">
                          <div class="day-progress-fill" style="width: ${progress}%"></div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Weekly Summary -->
              <div class="summary-section">
                <div class="summary-card">
                  <div class="summary-header">
                    <span style="font-size: 20px;">👥</span>
                    <h3 class="summary-title">Week Summary</h3>
                  </div>
                  <div class="summary-text">
                    You tracked ${reportData.daysWithData} out of 7 days this week. 
                    Your daily average was ${reportData.overallAverageCaloriesPerDay} calories, 
                    which is within your healthy range. Keep up the great work maintaining 
                    consistent nutrition tracking!
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              Generated on ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} • Nutrition Report PDF
            </div>
          </div>
        </body>
      </html>
    `;
  }
}