# Smart Student Performance Tracking System

A clean, modern, and educational dashboard designed for tracking individual student performance in shape-building exercises. 
This dashboard features a Faculty Login portal, a multi-student management system, and comprehensive analytics.

## Features
* **Faculty Login**: Secure mock login portal for faculty members.
* **Student Management**: Add new students on the fly and track their metrics individually. 
* **Faculty Analytics Overview**: High-level metrics tracking total students, best-performing student, and average class accuracy.
* **Student Analytics**: Real-time Pie, Bar, and Line charts specifically isolated to the currently selected student.
* **Report Generation**: Export a student's entire history and summary metrics directly to a CSV file.
* **Simulation Engine**: Fully automated mock data generation engine that acts as a live demo.

## How to Run

1. You do not need any backend server.
2. Open `login.html` in your web browser.
3. Login using the dummy credentials:
   - **Username**: `faculty`
   - **Password**: `1234`
4. You will be redirected to the main dashboard (`index.html`).
5. **Usage Flow**:
   - Create a new student by typing a name in the top bar and clicking the `+` button.
   - The student will automatically be selected.
   - Click **Start Session** to begin the simulation. Watch as the student's metrics, charts, and history table populate live!
   - You can stop the session, add another student, and switch between them. The dashboard will instantly recall and display the correct metrics for the selected student.
   - Click **Export Report** to download the student's CSV file.
