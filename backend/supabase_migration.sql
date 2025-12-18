-- Supabase Migration: Create Questions and Question Usage Tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_hash VARCHAR(64) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    topic VARCHAR(200),
    difficulty_level VARCHAR(20) NOT NULL CHECK (difficulty_level IN ('Easy', 'Medium', 'Hard')),
    marks INTEGER NOT NULL CHECK (marks > 0),
    exam_type VARCHAR(50) NOT NULL,
    college VARCHAR(200) NOT NULL,
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Blocked', 'Archived')),
    embedding JSONB
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_hash ON questions(question_hash);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type);
CREATE INDEX IF NOT EXISTS idx_questions_college ON questions(college);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_created_date ON questions(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_questions_text ON questions USING gin(to_tsvector('english', question_text));

-- Create question_usage table
CREATE TABLE IF NOT EXISTS question_usage (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    exam_name VARCHAR(200) NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    college VARCHAR(200) NOT NULL,
    date_used TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for question_usage
CREATE INDEX IF NOT EXISTS idx_question_usage_question_id ON question_usage(question_id);
CREATE INDEX IF NOT EXISTS idx_question_usage_academic_year ON question_usage(academic_year);
CREATE INDEX IF NOT EXISTS idx_question_usage_college ON question_usage(college);
CREATE INDEX IF NOT EXISTS idx_question_usage_date_used ON question_usage(date_used DESC);

-- Enable Row Level Security (RLS) - optional, adjust based on your needs
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your authentication needs)
-- For now, allow all operations for service role
CREATE POLICY "Allow all operations for service role" ON questions
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations for service role" ON question_usage
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Or, if you want to disable RLS for now (not recommended for production):
-- ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE question_usage DISABLE ROW LEVEL SECURITY;

