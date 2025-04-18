-- Create the hall_allocations table
CREATE TABLE IF NOT EXISTS hall_allocations (
  id SERIAL PRIMARY KEY,
  register_number TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  hall_name TEXT NOT NULL,
  seat_number TEXT NOT NULL,
  exam_date TEXT NOT NULL,
  exam_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on register_number for faster searches
CREATE INDEX IF NOT EXISTS idx_hall_allocations_register_number ON hall_allocations(register_number);

-- Sample data for testing (optional)
INSERT INTO hall_allocations (register_number, student_name, hall_name, seat_number, exam_date, exam_time)
VALUES
  ('REG12345', 'John Doe', 'Main Hall A', 'A101', '2023-05-15', '09:00 AM'),
  ('REG12346', 'Jane Smith', 'Main Hall A', 'A102', '2023-05-15', '09:00 AM'),
  ('REG12347', 'Robert Johnson', 'Main Hall B', 'B201', '2023-05-15', '01:00 PM'),
  ('REG12348', 'Emily Davis', 'Main Hall B', 'B202', '2023-05-15', '01:00 PM'),
  ('REG12349', 'Michael Wilson', 'Science Block', 'S101', '2023-05-16', '09:00 AM')
ON CONFLICT (register_number) DO NOTHING;
