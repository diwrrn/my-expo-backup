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
      
      // Create HTML template with updated design matching WeeklyReportScreen
      const htmlContent = this.createWeeklyReportHTML(reportData, userName, dailyCalorieGoal);
      
      
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
      
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${userName}'s Weekly Nutrition Report`
        });
      } 
      
    } catch (error) {
    
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
              color: #111827;
              background: #FFFFFF;
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
              padding: 16px;
              border-bottom: 1px solid #E5E7EB;
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
            }
            
            .header-title {
              font-size: 18px;
              font-weight: 700;
              color: #111827;
            }
            
            .dl-btn {
              display: flex;
              flex-direction: row;
              align-items: center;
              background: #22C55E;
              padding: 8px 12px;
              border-radius: 8px;
              gap: 6px;
            }
            
            .dl-txt {
              color: #FFFFFF;
              font-weight: 600;
            }
            
            .period-row {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 10px;
              padding: 10px 16px;
              border-bottom: 1px solid #F3F4F6;
            }
            
            .period-txt {
              color: #111827;
              font-weight: 600;
            }
            
            .subtle {
              color: #6B7280;
              font-size: 12px;
            }
            
            .content {
              padding: 0 16px;
            }
            
            .stats-section {
              background: #FFFFFF;
              padding: 24px 0;
              margin-bottom: 20px;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
            }
            
            .stat-card {
              text-align: center;
              padding: 20px 16px;
              background: #F9FAFB;
              border-radius: 10px;
              border: 1px solid #F3F4F6;
            }
            
            .stat-value {
              font-size: 24px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 4px;
            }
            
            .stat-label {
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 2px;
            }
            
            .stat-subtitle {
              font-size: 12px;
              color: #6B7280;
              font-weight: 500;
            }
            
            .section {
              background: #FFFFFF;
              margin-bottom: 20px;
              padding: 20px 0;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 16px;
            }
            
            .category-card {
              padding: 16px;
              background: #F9FAFB;
              border-radius: 10px;
              margin-bottom: 12px;
              border: 1px solid #F3F4F6;
            }
            
            .category-header {
              margin-bottom: 12px;
            }
            
            .category-title-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            
            .category-left {
              display: flex;
              align-items: center;
            }
            
            .category-icon {
              font-size: 24px;
              margin-right: 12px;
            }
            
            .category-name {
              font-size: 16px;
              font-weight: 700;
              color: #111827;
            }
            
            .items-badge {
              background: #22C55E;
              padding: 4px 8px;
              border-radius: 6px;
            }
            
            .items-count {
              font-size: 12px;
              font-weight: 600;
              color: #FFFFFF;
            }
            
            .category-description {
              font-size: 14px;
              color: #6B7280;
              font-weight: 500;
              margin-bottom: 12px;
            }
            
            .calories-summary {
              text-align: center;
              background: #FFFFFF;
              padding: 12px;
              border-radius: 8px;
              border: 1px solid #F3F4F6;
            }
            
            .total-calories {
              font-size: 20px;
              font-weight: 700;
              color: #22C55E;
              margin-bottom: 2px;
            }
            
            .calories-unit {
              font-size: 12px;
              color: #6B7280;
              font-weight: 500;
            }
            
            .daily-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            
            .day-card {
              background: #F9FAFB;
              border-radius: 8px;
              padding: 12px;
              border: 1px solid #F3F4F6;
            }
            
            .day-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            }
            
            .day-name {
              font-size: 14px;
              font-weight: 600;
              color: #111827;
            }
            
            .day-percentage {
              font-size: 12px;
              font-weight: 600;
              color: #22C55E;
            }
            
            .day-calories {
              font-size: 16px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 8px;
            }
            
            .day-progress {
              width: 100%;
              height: 4px;
              background: #F3F4F6;
              border-radius: 2px;
              overflow: hidden;
            }
            
            .day-progress-fill {
              height: 100%;
              background: #22C55E;
              border-radius: 2px;
            }
            
            .summary-section {
              padding: 20px 0;
            }
            
            .summary-card {
              background: #F9FAFB;
              border-radius: 10px;
              padding: 16px;
              border: 1px solid #F3F4F6;
            }
            
            .summary-title {
              font-size: 16px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 8px;
            }
            
            .summary-text {
              font-size: 14px;
              color: #6B7280;
              line-height: 1.5;
            }
            
            .footer {
              text-align: center;
              padding: 24px 16px;
              color: #6B7280;
              font-size: 12px;
              border-top: 1px solid #F3F4F6;
              background: #F9FAFB;
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
              <h1 class="header-title">Weekly Report</h1>
              <div class="dl-btn">
                <span class="dl-txt">PDF Report</span>
              </div>
            </div>

            <!-- Period Info -->
            <div class="period-row">
              <span class="period-txt">Period: ${reportData.weekStart} → ${reportData.weekEnd} (Fri→Thu)</span>
              <span class="subtle">${reportData.daysWithData} day(s) with logs</span>
            </div>

            <div class="content">
              <!-- Summary Stats -->
              <div class="stats-section">
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value">${reportData.overallAverageCaloriesPerDay.toLocaleString()}</div>
                    <div class="stat-label">Daily Average</div>
                    <div class="stat-subtitle">calories</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${reportData.daysWithData}</div>
                    <div class="stat-label">Days Tracked</div>
                    <div class="stat-subtitle">of 7 days</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${Object.keys(reportData.foodCountsPerCategory).length}</div>
                    <div class="stat-label">Food Groups</div>
                    <div class="stat-subtitle">tracked</div>
                  </div>
                </div>
              </div>

              <!-- Food Categories -->
              <div class="section">
                <h2 class="section-title">Food Categories</h2>
                
                ${Object.entries(reportData.foodCountsPerCategory).map(([category, count]) => {
                  const avgCalories = reportData.averageCaloriesPerCategory[category];
                  const weeklyCalories = avgCalories * 7;
                  
                  return `
                    <div class="category-card">
                      <div class="category-header">
                        <div class="category-title-row">
                          <div class="category-left">
                            <span class="category-icon">${categoryIcons[category] || '🍽️'}</span>
                            <span class="category-name">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                          </div>
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
                <h2 class="section-title">Daily Breakdown</h2>
                
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
                  <h3 class="summary-title">Week Summary</h3>
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