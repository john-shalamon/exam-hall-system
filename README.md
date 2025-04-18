# Student Exam Hall Checker

A web application that allows students to check their exam hall by entering their register number. Administrators can upload hall allocation data through structured files or images.

## Features

- **Student Search**: Simple interface for students to find their exam hall
- **Admin Authentication**: Secure login for administrators
- **File Upload**: Support for CSV and Excel files
- **OCR Processing**: Extract data from images of hall allocation sheets
- **Data Management**: View, search, and delete allocation records

## Setup Instructions

1. **Database Setup**:
   - Run the SQL script in `setup-database.sql` in your Supabase SQL Editor to create the necessary table and indexes.

2. **Admin Login Credentials**:
   - Username: `admin`
   - Password: `password`
   - Note: In a production environment, you should implement proper authentication with Supabase Auth.

3. **File Format for Uploads**:
   - CSV/Excel files should have columns for: register_number, student_name, hall_name, seat_number, exam_date, exam_time
   - The system will attempt to map similar column names (e.g., "regNo" to "register_number")

4. **OCR Processing**:
   - For best results, ensure images are clear and text is well-formatted
   - The OCR system works best with tabular data where each student's information is on consecutive lines

## Development

This project uses:
- Next.js with App Router
- Supabase for database
- shadcn/ui for components
- Tesseract.js for OCR
- Papa Parse and xlsx for file parsing

## Security Considerations

- The admin authentication is currently a simple mock implementation
- For production, implement proper authentication with Supabase Auth
- Consider adding rate limiting for the student search to prevent abuse
\`\`\`

Let's also create a sample CSV file that users can download as a template:

```csv file="sample-hall-allocation.csv" type="code"
register_number,student_name,hall_name,seat_number,exam_date,exam_time
REG12345,John Doe,Main Hall A,A101,2023-05-15,09:00 AM
REG12346,Jane Smith,Main Hall A,A102,2023-05-15,09:00 AM
REG12347,Robert Johnson,Main Hall B,B201,2023-05-15,01:00 PM
REG12348,Emily Davis,Main Hall B,B202,2023-05-15,01:00 PM
REG12349,Michael Wilson,Science Block,S101,2023-05-16,09:00 AM
