/* -- Customer Table --

This table stores customer information. Each customer has a unique ID and a clerk user ID.
The table also tracks the creation timestamp. */

DEFINE TABLE Customer SCHEMAFULL
      PERMISSIONS FOR select, create, update, delete WHERE id = $auth.id;

DEFINE FIELD id ON Customer TYPE string ASSERT $value != NONE;
DEFINE FIELD clerk_user_id ON Customer TYPE string;
DEFINE FIELD name ON Customer TYPE string;
DEFINE FIELD email ON Customer TYPE string ASSERT string::is::email($value);
DEFINE FIELD created_at ON Customer TYPE datetime;

DEFINE INDEX idx_Customer_id ON Customer FIELDS id UNIQUE;
DEFINE INDEX idx_Customer_clerk_user_id ON Customer FIELDS clerk_user_id UNIQUE;

/* -- Chat Table --

This table stores chat information. Each chat has a unique ID and is linked to a customer.
The table also tracks the status, start, and end timestamps. */

DEFINE TABLE Chat SCHEMAFULL
    PERMISSIONS FOR select, create, update, delete WHERE id = $auth.id;

DEFINE FIELD id ON Chat TYPE string ASSERT $value != NONE;
DEFINE FIELD customer_id ON Chat TYPE record<Customer>;
DEFINE FIELD status ON Chat TYPE string ASSERT $value IN ["active", "viewed", "closed"];
DEFINE FIELD started_at ON Chat TYPE datetime;
DEFINE FIELD ended_at ON Chat TYPE datetime;

DEFINE INDEX idx_Chat_id ON Chat FIELDS id UNIQUE;
DEFINE INDEX idx_Chat_customer_id ON Chat FIELDS customer_id UNIQUE;

/* -- Message Table --

This table stores message information. Each message has a unique ID and is linked to a chat.
The table also tracks the sender ID, content, and sent timestamp. */

DEFINE TABLE Message SCHEMAFULL
    PERMISSIONS FOR select, create, update, delete WHERE id = $auth.id;

DEFINE FIELD id ON Message TYPE string ASSERT $value != NONE;
DEFINE FIELD chat_id ON Message TYPE record<Chat>;
DEFINE FIELD sender_id ON Message TYPE string;
DEFINE FIELD content ON Message TYPE string;
DEFINE FIELD sent_at ON Message TYPE datetime;

DEFINE INDEX idx_Message_id ON Message FIELDS id UNIQUE;
DEFINE INDEX idx_Message_chat_id ON Message FIELDS chat_id UNIQUE;
DEFINE INDEX idx_Message_sender_id ON Message FIELDS sender_id UNIQUE;

/* -- Feedback Table --

This table stores feedback information. Each feedback has a unique ID and is linked to a chat.
The table also tracks the rating, comment, and submitted timestamp. */

DEFINE TABLE Feedback SCHEMAFULL
    PERMISSIONS FOR select, create, update, delete WHERE id = $auth.id;

DEFINE FIELD id ON Feedback TYPE string ASSERT $value != NONE;
DEFINE FIELD chat_id ON Feedback TYPE record<Chat>;
DEFINE FIELD rating ON Feedback TYPE int ASSERT $value >= 1 AND $value <= 5;
DEFINE FIELD comment ON Feedback TYPE string;
DEFINE FIELD submitted_at ON Feedback TYPE datetime;

DEFINE INDEX idx_Feedback_id ON Feedback FIELDS id UNIQUE;
DEFINE INDEX idx_Feedback_chat_id ON Feedback FIELDS chat_id UNIQUE;