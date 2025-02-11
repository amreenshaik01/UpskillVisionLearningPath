CREATE DATABASE UpskillVision;
USE UpskillVision;

-- Roles Table
-- This table stores different roles within the system. Each role has a unique ID, name, description, and timestamps for creation and last update.
CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- Permissions Table
-- This table defines the various permissions that can be assigned to roles. It includes a unique ID, name, description, and timestamps.
CREATE TABLE permissions (
    permission_id INT PRIMARY KEY AUTO_INCREMENT,
    permission_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);


-- Role-Permission Mapping Table
-- This table creates a many-to-many relationship between roles and permissions. It maps which permissions are assigned to which roles, enforcing referential integrity with foreign keys.
CREATE TABLE role_permissions (
    role_id INT,
    permission_id INT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
);


-- Users Table
--  This table stores user information, including login credentials, personal details, role, and status. It also maintains timestamps for user creation and last update.
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(50) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
	enrollment_count INT DEFAULT 0,
    courses_completed INT DEFAULT 0,
    session_token VARCHAR(255),
    role_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- User Authentication Attempts Table
-- This table logs user authentication attempts, recording details such as time, IP address, and success status. It helps in tracking login activities.
CREATE TABLE auth_attempts (
    attempt_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    is_successful BOOLEAN,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Password Reset Tokens Table
-- This table manages password reset requests by storing tokens, expiration times, and usage status. It ensures security for password recovery processes.
CREATE TABLE password_reset_tokens (
    token_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    reset_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Department Table
-- This table holds department information, including the department name, description, and manager. It is useful for organizing users into departments.
CREATE TABLE departments (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(user_id)
);

-- User-Department Mapping Table
-- This table creates a many-to-many relationship between users and departments, mapping users to their respective departments.
CREATE TABLE user_departments (
    user_id INT,
    department_id INT,
    PRIMARY KEY (user_id, department_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);


-- Courses Table
-- This table stores information about the courses, including a unique identifier, title, description, instructor, and dates.
CREATE TABLE courses (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    course_name VARCHAR(100) NOT NULL,
    description TEXT,
    instructor_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    enrollment_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(user_id)
);


CREATE TABLE user_courses (
    enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    
    completion_date TIMESTAMP NULL,
	status ENUM('enrolled', 'completed', 'dropped') DEFAULT 'enrolled',
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE (user_id, course_id)
);


-- Course Notifications Table
-- This table records notifications sent to users about new courses.
CREATE TABLE course_notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    user_id INT NOT NULL,
    notification_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


-- Trigger to automatically send notifications upon course creation
DELIMITER //

CREATE TRIGGER notify_users_on_course_creation
AFTER INSERT ON courses
FOR EACH ROW
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE uid INT;
    DECLARE user_cursor CURSOR FOR SELECT user_id FROM users WHERE is_active = TRUE;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN user_cursor;
    
    notify_loop: LOOP
        FETCH user_cursor INTO uid;
        IF done THEN
            LEAVE notify_loop;
        END IF;
        
        -- Insert a notification record for each active user
        INSERT INTO course_notifications (course_id, user_id) VALUES (NEW.course_id, uid);
        
        -- Here you can add code to send actual email notifications
        -- For example: CALL send_email(uid, NEW.course_id);
    END LOOP;
    
    CLOSE user_cursor;
END //

DELIMITER ;


-- Modules Table
-- Stores details about each module within a course, including learning points and order.
CREATE TABLE modules (
    module_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    module_title VARCHAR(100) NOT NULL,
    learning_points TEXT,
    order_no INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- Resources Table
-- Stores resources related to each module, such as links, files, or materials.
CREATE TABLE resources (
    resource_id INT PRIMARY KEY AUTO_INCREMENT,
    module_id INT NOT NULL,
    resource_title VARCHAR(100) NOT NULL,
    resource_type ENUM('link', 'file', 'text') NOT NULL,
    resource_content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
);

-- Quizzes Table
-- Stores quiz details for each module, including pass criteria and total score.
CREATE TABLE quizzes (
    quiz_id INT PRIMARY KEY AUTO_INCREMENT,
    module_id INT NOT NULL,
    quiz_title VARCHAR(100) NOT NULL,
    total_score INT NOT NULL,
    passing_score INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
);

-- Quiz Questions Table
-- Stores questions for each quiz, including type, content, and associated answers.
CREATE TABLE quiz_questions (
    question_id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('mcq', 'true_false') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

-- Quiz Answers Table
-- Stores answers for quiz questions, including whether the answer is correct.
CREATE TABLE quiz_answers (
    answer_id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(question_id) ON DELETE CASCADE
);


CREATE TABLE progress (
    progress_id INT PRIMARY KEY AUTO_INCREMENT,      
    user_id INT NOT NULL,  
    module_id INT NOT NULL,                          
    completion_status ENUM('not started', 'in progress', 'completed') DEFAULT 'not started',
    quiz_score INT DEFAULT 0,                        
    resources_completed INT DEFAULT 0,              
    pass_fail_status VARCHAR(10),      
    correct_answers INT DEFAULT NULL,
    incorrect_answers INT DEFAULT NULL,
    skipped_answers INT DEFAULT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
);


-- Course Reviews Table
-- Stores user feedback for courses, including ratings, comments, and timestamps.
CREATE TABLE course_reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5), -- Ratings from 1 to 5
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


CREATE TABLE course_leaderboard (
    leaderboard_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    user_id INT NOT NULL,
    score INT DEFAULT 0,
    user_rank INT,
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


CREATE TABLE course_tags (
    tag_id INT PRIMARY KEY AUTO_INCREMENT,
    tag_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE course_tag_mapping (
    course_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (course_id, tag_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (tag_id) REFERENCES course_tags(tag_id)
);


-- Indexes for performance
-- These indexes improve query performance for frequently accessed columns in the users and password_reset_tokens tables.
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_role ON users(role_id);
CREATE INDEX idx_reset_token ON password_reset_tokens(reset_token);
CREATE INDEX idx_course_name ON courses(course_name);
CREATE INDEX idx_instructor_id ON courses(instructor_id);
CREATE INDEX idx_course_id ON user_courses(course_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_auth_attempts_user_id ON auth_attempts(user_id);
CREATE INDEX idx_auth_attempts_attempt_time ON auth_attempts(attempt_time);
CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_progress_module_id ON progress(module_id);
CREATE INDEX idx_course_reviews_course_id ON course_reviews(course_id);
CREATE INDEX idx_course_reviews_user_id ON course_reviews(user_id);
CREATE INDEX idx_course_tag_mapping_course_id ON course_tag_mapping(course_id);
CREATE INDEX idx_course_tag_mapping_tag_id ON course_tag_mapping(tag_id);
CREATE INDEX idx_course_leaderboard_course_id ON course_leaderboard(course_id);
CREATE INDEX idx_course_leaderboard_user_id ON course_leaderboard(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX idx_departments_manager_id ON departments(manager_id);
CREATE INDEX idx_departments_department_name ON departments(department_name);


-- Initial Roles
INSERT INTO roles (role_name, description) VALUES 
('HR Admin', 'Human Resources Administrator with full system access'),
('Manager', 'Team and performance monitoring'),
('Instructor', 'Training and course management'),
('Participant', 'Program participant with limited access');


-- Initial Permissions
INSERT INTO permissions (permission_name, description) VALUES
('READ_USER', 'View user information'),
('EDIT_USER', 'Modify user details'),
('CREATE_USER', 'Create new users'),
('DELETE_USER', 'Remove users from system'),
('VIEW_REPORTS', 'Access and generate reports'),
('MANAGE_ROLES', 'Create and modify roles'),
('APPROVE_SIGNUP', 'Approve new user registrations');


-- Initial Role-Permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- HR Admin Permissions
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
-- Manager Permissions
(2, 1), (2, 5),
-- Instructor Permissions
(3, 1), (3, 5),
-- Participant Permissions
(4, 1);


-- This section inserts a default HR Admin user with a predefined secure password and salt.
-- Generate a secure salt
SET @salt = 'HR_ADMIN_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);

-- Insert the initial HR Admin user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'admin', 
    'tanay.s1@ahduni.edu.in', 
    @password_hash, 
    @salt, 
    'Tanay', 
    'Shah', 
    1,  -- HR Admin role 
    TRUE, 
    TRUE  -- Approved by default
);


-- This section inserts a default Manager Admin user with a predefined secure password and salt.
-- Generate a secure salt
SET @salt = 'INSTRUCTOR_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);

-- Insert the initial manager user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'instructor3', 
    'amreenshaik6964@gmail.com', 
    @password_hash, 
    @salt, 
    'Dhaval', 
    'Patel', 
    3,  -- Instructor role 
    TRUE, 
    TRUE  -- Approved by default
);



-- This section inserts a default HR Admin user with a predefined secure password and salt. This user has all permissions by default.
-- Generate a secure salt
SET @salt = 'INSTRUCTOR_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);

-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'instructor1', 
    'tanay3527@gmail.com', 
    @password_hash, 
    @salt, 
    'Shefali', 
    'Naik', 
    3,  -- Instructor role 
    TRUE, 
    TRUE  -- Approved by default
);

-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'instructor2', 
    'tanays0505@gmail.com', 
    @password_hash, 
    @salt, 
    'Amit', 
    'Nanavati', 
    3,  -- Instructor role 
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'MANAGER_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'manager1', 
    'tanayshah1501@gmail.com', 
    @password_hash, 
    @salt, 
    'Amreen', 
    'Shaik', 
    2,  -- Manager
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'MANAGER_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'manager2', 
    'amreenshaik531@gmail.com', 
    @password_hash, 
    @salt, 
    'Nikhil', 
    'Suryavanshi', 
    2,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);


-- Generate a secure salt
SET @salt = 'MANAGER_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'manager3', 
    'hitarth.s12@gmail.com', 
    @password_hash, 
    @salt, 
    'Hitarth', 
    'Shah', 
    2,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);


-- Generate a secure salt
SET @salt = 'MANAGER_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'manager4', 
    'shail.m01@gmail.com', 
    @password_hash, 
    @salt, 
    'Shail', 
    'Mankad', 
    2,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);


-- Generate a secure salt
SET @salt = 'MANAGER_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'manager5', 
    'mishka.m4@gmail.com', 
    @password_hash, 
    @salt, 
    'Mishka', 
    'Choganwala', 
    2,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);


-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant1', 
    'tanayshah9045@gmail.com', 
    @password_hash, 
    @salt, 
    'Harsh', 
    'Modi', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant3', 
    'pranitikubal9@gmail.com', 
    @password_hash, 
    @salt, 
    'Praniti', 
    'Kubal', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant4', 
    'svptsarveshk.5a@gmail.com', 
    @password_hash, 
    @salt, 
    'Bhuvan', 
    'Sulakhe', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant5', 
    'vaishvi.k4@gmail.com', 
    @password_hash, 
    @salt, 
    'Vaishvi', 
    'Patel', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant6', 
    'sarav.p3@gmail.com', 
    @password_hash, 
    @salt, 
    'Sarav', 
    'Panchal', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant7', 
    'karan.p8@gmail.com', 
    @password_hash, 
    @salt, 
    'Karan', 
    'Prajapati', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant8', 
    'soham.solan5@gmail.com', 
    @password_hash, 
    @salt, 
    'Soham', 
    'Solanki', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant9', 
    'prem.p7@gmail.com', 
    @password_hash, 
    @salt, 
    'Prem', 
    'Patel', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant10', 
    'dilpimaniar12@gmail.com', 
    @password_hash, 
    @salt, 
    'Dilpi', 
    'Maniar', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant11', 
    'diyakothari23@gmail.com', 
    @password_hash, 
    @salt, 
    'Diya', 
    'Kothari', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant12', 
    'pranjal.p4@gmail.com', 
    @password_hash, 
    @salt, 
    'Pranjal', 
    'Doshi', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant13', 
    'kushi.n4@gmail.com', 
    @password_hash, 
    @salt, 
    'Kushi', 
    'Shah', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant14', 
    'aashvi.gandhi7@gmail.com', 
    @password_hash, 
    @salt, 
    'Aashvi', 
    'Gandhi', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant15', 
    'dev.gorakhiya12@gmail.com', 
    @password_hash, 
    @salt, 
    'Dev', 
    'Gorakhiya', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant16', 
    'shlok.shelat5@gmail.com', 
    @password_hash, 
    @salt, 
    'Shlok', 
    'Shelat', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant17', 
    'shrey.salvi3@gmail.com', 
    @password_hash, 
    @salt, 
    'Shrey', 
    'Salvi', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant18', 
    'pratham.k3@gmail.com', 
    @password_hash, 
    @salt, 
    'Pratham', 
    'Kankotiya', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant19', 
    'ritu.v5@gmail.com', 
    @password_hash, 
    @salt, 
    'Ritu', 
    'Purohit', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant20', 
    'palak.p2@gmail.com', 
    @password_hash, 
    @salt, 
    'Palak', 
    'Patel', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);

-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant21', 
    'raj.dave45@gmail.com', 
    @password_hash, 
    @salt, 
    'Raj', 
    'Dave', 
    4,  -- Participant
    TRUE, 
    TRUE  -- Approved by default
);


-- Generate a secure salt
SET @salt = 'PARTICIPANT_INITIAL_SALT_2024';

-- Generate a secure password hash
SET @password_hash = SHA2(CONCAT('Tanay12!@', @salt), 256);
-- Insert the initial instructor user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    salt, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_approved
) VALUES (
    'participant2', 
    'mihirshah384@gmail.com', 
    @password_hash, 
    @salt, 
    'Aryan', 
    'Sukhadia', 
    4,  -- Participant
    TRUE, 
    FALSE  -- Approved by default
);



INSERT INTO courses (course_name, description, instructor_id, start_date, end_date) VALUES
('Introduction to Python', 'Learn the basics of Python programming.', 2, '2025-02-01', '2025-03-01'),
('Web Development with React', 'A complete guide to building modern web applications using ReactJS.', 3, '2025-02-05', '2025-03-12'),
('Data Science Bootcamp', 'Master data analysis and visualization techniques.', 4, '2025-02-10', '2025-03-17'),
('Database Management', 'Learn database design and querying using SQL.', 2, '2025-02-15', '2025-03-22'),
('Advanced Java Programming', 'Deep dive into Java programming concepts and frameworks.', 3, '2025-02-20', '2025-03-27'),
('Introduction to Machine Learning', 'A beginner-friendly course on ML concepts and applications.', 4, '2025-03-01', '2025-04-01'),
('DevOps Essentials', 'Understand the basics of DevOps tools and workflows.', 2, '2025-03-05', '2025-04-02'),
('Cybersecurity Fundamentals', 'Learn the basics of securing systems and networks.', 3, '2025-03-10', '2025-04-07'),
('Cloud Computing Basics', 'An introduction to cloud platforms and services.', 4, '2025-03-15', '2025-04-12'),
('Frontend Development with HTML & CSS', 'Master the art of designing beautiful web pages.', 2, '2025-03-20', '2025-04-17'),
('Full-Stack Development', 'Learn to build end-to-end web applications.', 3, '2025-03-25', '2025-04-22'),
('Big Data Analytics', 'Analyze and process large datasets using Hadoop and Spark.', 4, '2025-03-30', '2025-04-26'),
('Digital Marketing Strategies', 'Learn effective digital marketing techniques.', 2, '2025-04-01', '2025-05-01'),
('Artificial Intelligence Basics', 'Understand the basics of AI and its applications.', 3, '2025-04-05', '2025-05-03'),
('Introduction to Blockchain', 'Explore the fundamentals of blockchain technology.', 4, '2025-04-10', '2025-05-08'),
('Game Development with Unity', 'Build games using Unity and C#.', 2, '2025-04-15', '2025-05-13'),
('Mobile App Development', 'Learn to develop Android and iOS applications.', 3, '2025-04-20', '2025-05-18'),
('Software Testing & QA', 'Understand software testing methodologies and tools.', 4, '2025-04-25', '2025-05-23'),
('UI/UX Design Principles', 'Learn the principles of user interface and experience design.', 2, '2025-04-30', '2025-05-28'),
('Project Management Basics', 'Understand project management methodologies and tools.', 3, '2025-05-01', '2025-05-29');


INSERT INTO user_courses (user_id, course_id, enrollment_date, completion_date, status) 
VALUES 
(10, 20, '2025-01-10 09:00:00', '2025-01-28 18:00:00', 'completed'),
(10, 19, '2025-01-11 10:30:00', NULL, 'enrolled'),
(10, 18, '2025-01-12 12:00:00', NULL, 'dropped'),
(10, 17, '2025-01-14 08:00:00', NULL, 'enrolled'),
(10, 16, '2025-01-15 13:00:00', '2025-01-26 17:30:00', 'completed'),
(10, 15, '2025-01-18 09:30:00', NULL, 'enrolled'),
(10, 14, '2025-01-20 14:30:00', NULL, 'dropped'),

(11, 2, '2025-01-10 09:00:00', '2025-01-28 18:00:00', 'completed'),
(11, 4, '2025-01-11 10:30:00', NULL, 'enrolled'),
(11, 7, '2025-01-12 12:00:00', NULL, 'dropped'),
(11, 9, '2025-01-14 08:00:00', NULL, 'enrolled'),
(11, 15, '2025-01-15 13:00:00', '2025-01-26 17:30:00', 'completed'),
(11, 19, '2025-01-18 09:30:00', NULL, 'enrolled'),
(11, 1, '2025-01-20 14:30:00', NULL, 'dropped'),

(12, 5, '2025-01-11 09:30:00', NULL, 'enrolled'),
(12, 6, '2025-01-12 10:00:00', '2025-01-23 15:00:00', 'completed'),
(12, 8, '2025-01-14 11:30:00', NULL, 'dropped'),
(12, 10, '2025-01-15 10:00:00', NULL, 'enrolled'),
(12, 14, '2025-01-16 12:30:00', '2025-01-25 16:00:00', 'completed'),
(12, 16, '2025-01-18 13:30:00', NULL, 'enrolled'),
(12, 20, '2025-01-21 11:00:00', NULL, 'dropped'),

(13, 3, '2025-01-10 10:00:00', '2025-01-28 18:00:00', 'completed'),
(13, 5, '2025-01-11 10:30:00', NULL, 'enrolled'),
(13, 7, '2025-01-12 12:00:00', NULL, 'dropped'),
(13, 9, '2025-01-14 08:00:00', NULL, 'enrolled'),
(13, 11, '2025-01-15 13:00:00', '2025-01-26 17:30:00', 'completed'),
(13, 14, '2025-01-18 09:30:00', NULL, 'enrolled'),
(13, 18, '2025-01-20 14:30:00', NULL, 'dropped'),

(14, 2, '2025-01-12 10:00:00', NULL, 'enrolled'),
(14, 6, '2025-01-13 09:30:00', '2025-01-25 18:00:00', 'completed'),
(14, 8, '2025-01-15 12:00:00', NULL, 'dropped'),
(14, 10, '2025-01-16 11:00:00', NULL, 'enrolled'),
(14, 13, '2025-01-17 13:30:00', '2025-01-28 17:30:00', 'completed'),
(14, 17, '2025-01-19 14:30:00', NULL, 'enrolled'),
(14, 20, '2025-01-21 16:00:00', NULL, 'dropped'),

(15, 3, '2025-01-11 09:30:00', '2025-01-28 15:00:00', 'completed'),
(15, 5, '2025-01-12 10:00:00', NULL, 'enrolled'),
(15, 7, '2025-01-13 11:30:00', NULL, 'dropped'),
(15, 9, '2025-01-15 10:00:00', NULL, 'enrolled'),
(15, 12, '2025-01-17 13:00:00', '2025-01-28 16:00:00', 'completed'),
(15, 16, '2025-01-19 14:30:00', NULL, 'enrolled'),
(15, 19, '2025-01-21 11:30:00', NULL, 'dropped'),

(16, 4, '2025-01-10 10:30:00', NULL, 'enrolled'),
(16, 7, '2025-01-12 12:00:00', '2025-01-22 16:00:00', 'completed'),
(16, 9, '2025-01-13 14:00:00', NULL, 'dropped'),
(16, 11, '2025-01-15 11:30:00', NULL, 'enrolled'),
(16, 14, '2025-01-17 13:00:00', '2025-01-26 18:00:00', 'completed'),
(16, 18, '2025-01-19 15:30:00', NULL, 'enrolled'),
(16, 1, '2025-01-21 12:30:00', NULL, 'dropped'),

(17, 2, '2025-01-09 10:00:00', '2025-01-28 18:00:00', 'completed'),
(17, 6, '2025-01-11 09:30:00', NULL, 'enrolled'),
(17, 8, '2025-01-13 12:00:00', NULL, 'dropped'),
(17, 10, '2025-01-14 11:00:00', NULL, 'enrolled'),
(17, 13, '2025-01-16 14:00:00', '2025-01-25 17:00:00', 'completed'),
(17, 15, '2025-01-18 15:30:00', NULL, 'enrolled'),
(17, 19, '2025-01-21 10:30:00', NULL, 'dropped'),

(18, 3, '2025-01-10 08:30:00', NULL, 'enrolled'),
(18, 7, '2025-01-12 11:00:00', '2025-01-25 14:30:00', 'completed'),
(18, 9, '2025-01-14 13:00:00', NULL, 'dropped'),
(18, 12, '2025-01-15 09:00:00', NULL, 'enrolled'),
(18, 14, '2025-01-17 10:30:00', '2025-01-26 18:30:00', 'completed'),
(18, 17, '2025-01-19 14:00:00', NULL, 'enrolled'),
(18, 1, '2025-01-20 15:00:00', NULL, 'dropped'),

(19, 5, '2025-01-11 09:00:00', '2025-01-28 16:00:00', 'completed'),
(19, 6, '2025-01-12 10:30:00', NULL, 'enrolled'),
(19, 8, '2025-01-14 11:30:00', NULL, 'dropped'),
(19, 10, '2025-01-15 13:30:00', NULL, 'enrolled'),
(19, 15, '2025-01-17 14:30:00', '2025-01-25 18:30:00', 'completed'),
(19, 18, '2025-01-19 15:30:00', NULL, 'enrolled'),
(19, 20, '2025-01-21 12:00:00', NULL, 'dropped'),

(20, 2, '2025-01-09 08:30:00', '2025-01-27 17:30:00', 'completed'),
(20, 4, '2025-01-10 09:00:00', NULL, 'enrolled'),
(20, 7, '2025-01-12 11:00:00', NULL, 'dropped'),
(20, 9, '2025-01-14 10:30:00', NULL, 'enrolled'),
(20, 12, '2025-01-15 14:00:00', '2025-01-25 16:00:00', 'completed'),
(20, 16, '2025-01-18 12:30:00', NULL, 'enrolled'),
(20, 19, '2025-01-21 11:30:00', NULL, 'dropped'),

(21, 3, '2025-01-10 08:30:00', NULL, 'enrolled'),
(21, 5, '2025-01-12 10:00:00', NULL, 'dropped'),
(21, 8, '2025-01-13 12:30:00', '2025-01-26 18:00:00', 'completed'),
(21, 10, '2025-01-14 14:00:00', NULL, 'enrolled'),
(21, 14, '2025-01-15 16:00:00', '2025-01-27 17:30:00', 'completed'),
(21, 17, '2025-01-18 13:00:00', NULL, 'enrolled'),
(21, 1, '2025-01-20 15:30:00', NULL, 'dropped'),

(22, 2, '2025-01-11 09:00:00', NULL, 'enrolled'),
(22, 5, '2025-01-12 10:00:00', NULL, 'dropped'),
(22, 7, '2025-01-13 12:00:00', '2025-01-26 18:00:00', 'completed'),
(22, 9, '2025-01-14 14:00:00', NULL, 'enrolled'),
(22, 13, '2025-01-15 16:30:00', '2025-01-27 17:30:00', 'completed'),
(22, 17, '2025-01-18 12:00:00', NULL, 'enrolled'),
(22, 19, '2025-01-21 15:00:00', NULL, 'dropped'),

(23, 3, '2025-01-09 10:30:00', NULL, 'enrolled'),
(23, 6, '2025-01-10 11:00:00', '2025-01-24 15:00:00', 'completed'),
(23, 8, '2025-01-11 09:30:00', NULL, 'dropped'),
(23, 12, '2025-01-14 13:00:00', NULL, 'enrolled'),
(23, 14, '2025-01-15 12:30:00', '2025-01-25 18:00:00', 'completed'),
(23, 16, '2025-01-18 11:30:00', NULL, 'enrolled'),
(23, 1, '2025-01-20 14:00:00', NULL, 'dropped'),

(24, 2, '2025-01-11 09:00:00', NULL, 'enrolled'),
(24, 4, '2025-01-12 08:30:00', '2025-01-22 16:30:00', 'completed'),
(24, 7, '2025-01-13 10:00:00', NULL, 'dropped'),
(24, 9, '2025-01-14 12:30:00', NULL, 'enrolled'),
(24, 13, '2025-01-15 14:00:00', '2025-01-26 18:30:00', 'completed'),
(24, 15, '2025-01-18 10:00:00', NULL, 'enrolled'),
(24, 20, '2025-01-20 11:30:00', NULL, 'dropped'),

(25, 3, '2025-01-10 09:30:00', NULL, 'enrolled'),
(25, 5, '2025-01-11 10:30:00', NULL, 'dropped'),
(25, 6, '2025-01-12 11:00:00', '2025-01-24 14:30:00', 'completed'),
(25, 10, '2025-01-13 12:00:00', NULL, 'enrolled'),
(25, 14, '2025-01-15 13:30:00', '2025-01-25 17:30:00', 'completed'),
(25, 17, '2025-01-18 14:00:00', NULL, 'enrolled'),
(25, 19, '2025-01-21 15:30:00', NULL, 'dropped'),

(26, 2, '2025-01-10 10:00:00', NULL, 'enrolled'),
(26, 6, '2025-01-11 11:30:00', '2025-01-20 12:00:00', 'completed'),
(26, 7, '2025-01-10 09:00:00', NULL, 'dropped'),
(26, 10, '2025-01-20 08:00:00', NULL, 'enrolled'),
(26, 14, '2025-01-12 09:30:00', '2025-01-28 14:00:00', 'completed'),
(26, 17, '2025-01-19 13:00:00', NULL, 'enrolled'),
(26, 20, '2025-01-21 15:00:00', NULL, 'dropped'),

(27, 3, '2025-01-13 10:00:00', '2025-01-28 18:00:00', 'completed'),
(27, 5, '2025-01-15 11:00:00', NULL, 'enrolled'),
(27, 8, '2025-01-14 14:00:00', NULL, 'dropped'),
(27, 12, '2025-01-20 09:30:00', NULL, 'enrolled'),
(27, 16, '2025-01-22 16:30:00', '2025-01-28 17:00:00', 'completed'),
(27, 18, '2025-01-17 15:00:00', NULL, 'enrolled'),
(27, 1, '2025-01-18 13:30:00', NULL, 'dropped'),

(28, 9, '2025-01-15 08:00:00', NULL, 'enrolled'),
(28, 11, '2025-01-15 08:00:00', NULL, 'dropped'),
(28, 13, '2025-01-20 12:00:00', '2025-01-28 15:30:00', 'completed'),
(28, 15, '2025-01-25 09:00:00', NULL, 'enrolled'),
(28, 18, '2025-01-22 14:00:00', NULL, 'dropped'),
(28, 19, '2025-01-20 10:00:00', '2025-01-27 17:30:00', 'completed'),
(28, 1, '2025-01-28 10:30:00', NULL, 'enrolled'),

(29, 2, '2025-01-10 10:00:00', NULL, 'enrolled'),
(29, 5, '2025-01-11 11:30:00', NULL, 'dropped'),
(29, 8, '2025-01-12 09:00:00', '2025-01-20 15:00:00', 'completed'),
(29, 13, '2025-01-14 08:30:00', NULL, 'enrolled'),
(29, 17, '2025-01-15 14:00:00', '2025-01-25 18:00:00', 'completed'),
(29, 19, '2025-01-18 09:00:00', NULL, 'dropped'),
(29, 1, '2025-01-20 10:00:00', NULL, 'enrolled'),

(30, 3, '2025-01-11 10:00:00', NULL, 'enrolled'),
(30, 6, '2025-01-12 12:30:00', '2025-01-19 13:00:00', 'completed'),
(30, 8, '2025-01-14 09:30:00', NULL, 'dropped'),
(30, 11, '2025-01-15 11:00:00', NULL, 'enrolled'),
(30, 14, '2025-01-16 14:30:00', '2025-01-27 15:30:00', 'completed'),
(30, 18, '2025-01-20 16:00:00', NULL, 'enrolled'),
(30, 20, '2025-01-21 13:30:00', NULL, 'dropped');


SELECT * FROM course_notifications;
select * from roles;
SELECT * FROM courses;
SELECT * FROM user_courses;
SELECT * FROM users;
select * from progress;
select * from modules;
select * from resources;
select * from quizzes;
select * from quiz_questions;
select * from quiz_answers;
select * from departments;
select * from user_departments;
delete from courses;
delete from progress;
delete from quizzes;
delete from courses;
