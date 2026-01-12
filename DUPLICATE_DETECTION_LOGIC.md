# Duplicate Question Detection Logic

## Overview

The system now implements the following duplicate detection rules:

1. **Same Question, Same College** → Error: "Question already exists"
2. **Same Question, Different College** → Allowed, both instances get `usage_count = 2`

## Implementation Details

### Scenario 1: Same Question in Same College

**Behavior:**
- System detects exact duplicate (same hash) in the same college
- Raises `DuplicateQuestionError` with message: **"Question already exists"**
- Returns HTTP 400 Bad Request
- Does NOT create a new question
- Does NOT modify existing question's usage_count

**Example:**
```
Question: "What is machine learning?"
College: "College A"

First attempt: ✅ Created (ID: 1, usage_count: 1)
Second attempt (same college): ❌ Error: "Question already exists"
```

### Scenario 2: Same Question in Different College

**Behavior:**
- System detects exact duplicate (same hash) in a different college
- Allows creation of new question
- Sets `usage_count = 2` for **both** instances:
  - Existing question in College A: `usage_count = 2`
  - New question in College B: `usage_count = 2`
- This indicates the question exists in 2 places

**Example:**
```
Question: "What is machine learning?"
College: "College A"

First attempt: ✅ Created (ID: 1, usage_count: 1)
Second attempt (different college "College B"): ✅ Created (ID: 2, usage_count: 2)
Result: Both questions now have usage_count = 2
```

## Code Changes

### 1. Error Message (`app/services/question_service.py`)

**Before:**
```python
message=(
    f"Question already exists in college '{question.college}'. "
    f"Please use the existing question (ID: {existing_same_college.id}) or modify your question text."
)
```

**After:**
```python
message="Question already exists"
```

### 2. Usage Count Logic (`app/services/question_service.py`)

**Before:**
```python
new_total_usage = len(existing_exact_all) + 1
```

**After:**
```python
# When same question is added to different college, set usage_count to 2 for all instances
new_total_usage = 2
```

This ensures that when the same question exists in 2 colleges, both instances have `usage_count = 2`.

### 3. API Response (`app/api/routes.py`)

Enhanced error response to include clear message:
```python
raise HTTPException(status_code=400, detail={
    "message": error_message,
    **detail
})
```

## Testing

All tests pass:
- ✅ `test_add_same_question_to_different_college` - Verifies usage_count = 2 for both instances
- ✅ `test_cannot_add_duplicate_in_same_college` - Verifies error is raised

## Frontend Integration

The frontend will receive:
- **Error Response (400):**
  ```json
  {
    "message": "Question already exists",
    "code": "DUPLICATE_QUESTION_SAME_COLLEGE",
    "college": "College A",
    "existing_question_id": 123
  }
  ```

- **Success Response (201):** Normal question creation response

## Usage Count Meaning

- `usage_count = 1`: Question exists in only one college
- `usage_count = 2`: Question exists in two colleges
- `usage_count = N`: Question exists in N colleges

**Note:** This is different from the `record_question_usage` function which tracks actual exam usage. The `usage_count` field here represents how many colleges have this question.








