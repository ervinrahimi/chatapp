-- << -- Chat Table -- >>

DEFINE TABLE Chat TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE id = $auth.id;

-- ------------------------------
-- FIELDS
-- ------------------------------ 

DEFINE FIELD admin_id ON Chat TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD created_at ON Chat TYPE datetime PERMISSIONS FULL;
DEFINE FIELD ended_at ON Chat TYPE option<datetime> PERMISSIONS FULL;
DEFINE FIELD id ON Chat TYPE string ASSERT $value != NONE PERMISSIONS FULL;
DEFINE FIELD started_at ON Chat TYPE datetime PERMISSIONS FULL;
DEFINE FIELD status ON Chat TYPE string ASSERT $value INSIDE ['pending', 'active', 'viewed', 'closed'] PERMISSIONS FULL;
DEFINE FIELD updated_at ON Chat TYPE datetime VALUE time::now() PERMISSIONS FULL;
DEFINE FIELD user_id ON Chat TYPE record<ChatUser> PERMISSIONS FULL;

-- ------------------------------
-- INDEXES
-- ------------------------------ 

DEFINE INDEX idx_Chat_id ON Chat FIELDS id UNIQUE;

-- << -- ChatUser Table -- >>

DEFINE TABLE ChatUser TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE id = $auth.id;

-- ------------------------------
-- FIELDS
-- ------------------------------ 

DEFINE FIELD clerk_id ON ChatUser TYPE string ASSERT $value != NONE PERMISSIONS FULL;
DEFINE FIELD created_at ON ChatUser TYPE datetime PERMISSIONS FULL;
DEFINE FIELD email ON ChatUser TYPE string ASSERT string::is::email($value) PERMISSIONS FULL;
DEFINE FIELD id ON ChatUser TYPE string ASSERT $value != NONE PERMISSIONS FULL;
DEFINE FIELD name ON ChatUser TYPE string PERMISSIONS FULL;

-- ------------------------------
-- INDEXES
-- ------------------------------ 

DEFINE INDEX idx_ChatUser_id ON ChatUser FIELDS id UNIQUE;

-- << -- Feedback Table -- >>

DEFINE TABLE Feedback TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE id = $auth.id;

-- ------------------------------
-- FIELDS
-- ------------------------------ 

DEFINE FIELD chat_id ON Feedback TYPE record<Chat> PERMISSIONS FULL;
DEFINE FIELD comment ON Feedback TYPE string PERMISSIONS FULL;
DEFINE FIELD created_at ON Feedback TYPE datetime PERMISSIONS FULL;
DEFINE FIELD id ON Feedback TYPE string ASSERT $value != NONE PERMISSIONS FULL;
DEFINE FIELD rating ON Feedback TYPE int ASSERT $value >= 1 AND $value <= 5 PERMISSIONS FULL;
DEFINE FIELD submitted_at ON Feedback TYPE datetime PERMISSIONS FULL;
DEFINE FIELD updated_at ON Feedback TYPE datetime VALUE time::now() PERMISSIONS FULL;

-- ------------------------------
-- INDEXES
-- ------------------------------ 

DEFINE INDEX idx_Feedback_chat_id ON Feedback FIELDS chat_id UNIQUE;
DEFINE INDEX idx_Feedback_id ON Feedback FIELDS id UNIQUE;

-- << -- Message Table -- >>

DEFINE TABLE Message TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE id = $auth.id;

-- ------------------------------
-- FIELDS
-- ------------------------------ 

DEFINE FIELD chat_id ON Message TYPE record<Chat> PERMISSIONS FULL;
DEFINE FIELD content ON Message TYPE string PERMISSIONS FULL;
DEFINE FIELD created_at ON Message TYPE datetime PERMISSIONS FULL;
DEFINE FIELD id ON Message TYPE string ASSERT $value != NONE PERMISSIONS FULL;
DEFINE FIELD sender_id ON Message TYPE option<string> PERMISSIONS FULL;

-- ------------------------------
-- INDEXES
-- ------------------------------ 

DEFINE INDEX idx_Message_id ON Message FIELDS id UNIQUE;