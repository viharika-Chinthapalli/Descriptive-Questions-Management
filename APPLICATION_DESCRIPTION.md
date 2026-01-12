# Question Bank Management System - Application Description

## Overview

A **Question Bank Management System** that helps educational institutions manage, track, and prevent duplicate usage of descriptive exam questions across multiple colleges. The system automatically tracks question usage and provides intelligent duplicate detection to ensure question diversity in assessments.

## Key Features

### 1. **Question Management**
- Add descriptive exam questions with comprehensive metadata:
  - Question text, subject, unit name, academic year
  - Difficulty level, marks allocation, exam type
  - College/university association
- Search and filter questions by multiple criteria
- View detailed question information in organized cards

### 2. **Intelligent Duplicate Detection**
- **Exact Match Detection**: Uses SHA256 hashing to identify identical questions
- **Similarity Checking**: Detects semantically similar or rephrased questions to prevent accidental duplicates
- Real-time similarity checking before adding new questions

### 3. **Automatic Usage Tracking**
- Automatically records usage when questions are added
- Tracks usage count per question (typically 1 per college)
- Calculates total usage across all colleges for the same question
- Maintains usage history with timestamps and college information

### 4. **Usage Analytics**
- View usage history for any question
- See total usage count across all colleges
- Track which colleges have used specific questions
- Identify question popularity and reuse patterns

## Technical Architecture

- **Frontend**: React with Vite, modern responsive UI
- **Backend**: Express.js (Node.js) RESTful API
- **Storage**: JSON file-based storage (`data.json`)
- **Similarity Detection**: Hash-based exact matching and semantic similarity algorithms

## Use Cases

1. **Academic Institutions**: Manage question banks for multiple colleges/departments
2. **Exam Coordinators**: Ensure question diversity across assessments
3. **Faculty**: Track question usage and avoid repetition
4. **Quality Assurance**: Monitor question distribution and usage patterns

## Benefits

- **Prevents Duplicates**: Automatically detects and warns about similar questions
- **Usage Transparency**: Clear visibility into where and when questions are used
- **Multi-College Support**: Track questions across different institutions
- **Easy Management**: Simple interface for adding, searching, and managing questions
- **Automatic Tracking**: No manual record-keeping required - usage is tracked automatically

