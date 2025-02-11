import React from 'react'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login/Login'; 
import ForgotPasswordPage from './components/Forgot-Password/ForgotPassword';
import ResetPasswordPage from './components/Reset-Password/ResetPassword'; 
import SignUp from './components/Signup/SignUp';
import CreateCourse from './components/Create-Course/Create-Course';
import HRDashboard from './components/HR-Dashboard/HR-Dashboard';
import ManagerDashboard from './components/Manager-Dashboard/Manager-Dashboard';
import InstructorDashboard from './components/Instructor-Dashboard/Instructor-Dashboard';
import ParticipantDashboard from './components/Participant-Dashboard/Participant-Dashboard';
import CourseList from './components/User-Course-List/Course-List';
import CourseEditPage from './components/Edit-Course/CourseEditPage'; // Updated to match component name
import EditCourse  from './components/Edit-Course/EditCourse';
import DeleteCourse from './components/Edit-Course/DeleteCourse';
import UserCourselist from './components/User-Course-List/UserCourselist';
import Enrolled from './components/User-Course-List/Enrolled';
import Unenrolled from './components/User-Course-List/Unenrolled';
import Completed from './components/User-Course-List/Completed';
import CourseDetails from './components/User-Course-List/CourseDetails';
import AddModules from './components/Edit-Course/AddModules';
import AddResource from './components/Edit-Course/AddResource';
import QuizForm from './components/Quiz/QuizForm';
import QuestionForm from './components/Quiz/QuestionForm';
import QuizDetails from './components/Quiz/QuizDetails';
import QuizAttempt from "./components/Quiz/QuizAttempt";
import UserProgress from './components/UserProgress/UserProgress';
import UserProgressPage from './components/UserProgress/UserProgressPage';
import UserRoleManagement from "./components/UserRoleManagerment/UserRoleManagement";
import DepartmentManagementPage from './components/Manage-Deparment/DepartmentManagementPage';
import CreateDepartment from './components/Manage-Deparment/CreateDepartment';
import ChangeManager from './components/Manage-Deparment/ChangeManager';
import ViewDepartment from './components/Manage-Deparment/ViewDepartment';
import ChangeParticipants from './components/Manage-Deparment/ChangeParticipants';
import ManagerPerformanceDashboard from './components/Manager-Performance-Dashboard/ManagerPerformanceDashboard';
import ManagerParticipantPieChart from './components/Manager-Performance-Dashboard/ManagerParticipantPieChart';
import ManagerFilterPerformance from './components/Manager-Performance-Dashboard/ManagerFilterPerformance';
import ManagerLeaderboardPage from './components/Manager-Performance-Dashboard/ManagerLeaderboardPage';
import HRFilterPerformance from './components/HR-Performance-Dashboard/HRFilterPerformance';
import HRLeaderboardPage from './components/HR-Performance-Dashboard/HRLeaderboardPage';
import HRParticipantPieChart from './components/HR-Performance-Dashboard/HRParticipantPieChart';
import HRPerformanceDashboard from './components/HR-Performance-Dashboard/HRPerformanceDashboard';
import HRCourseReview from './components/HR-Performance-Dashboard/HRCourseReview'






const App = () => {
  return (
    <Router> 
      <Routes> 
        <Route path="/" element={<Login />} /> 
        
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        <Route path="/signup" element={<SignUp />} /> 

        <Route path="/courses" element={<CreateCourse />} /> 

        <Route path="/hr-dashboard" element={<HRDashboard />} />

        <Route path="/manager-dashboard" element={<ManagerDashboard />} />

        <Route path="/instructor-dashboard" element={<InstructorDashboard />} />

        <Route path="/participant-dashboard" element={<ParticipantDashboard />} />

        <Route path="/course-list" element={<CourseList />} />

        <Route path="/course-edit" element={<CourseEditPage />} />

        <Route path="/course-edit/:courseId" element={<CourseEditPage />} /> 

        <Route path="/edit-course/:courseId" element={<EditCourse />} />

        <Route path="/delete-course" element={<DeleteCourse />} />

        <Route path="/user-course-list" element={<UserCourselist />} />

        <Route path="/enrolled" element={<Enrolled />} />

        <Route path="/unenrolled" element={<Unenrolled />} />

        <Route path="/completed" element={<Completed />} />

        <Route path="/course-details/:courseId" element={<CourseDetails />} />

        <Route path="/add-modules" element={<AddModules />} />

        <Route path="/add-resource" element={<AddResource />} />

        <Route path="/add-quiz" element={<QuizForm />} />

        <Route path="/add-question/:quizId/:totalScore" element={<QuestionForm />} />

        <Route path="/quiz-details/:quizId/:moduleId" element={<QuizDetails />} />

        <Route path="/quiz/:quizId/:totalScore" element={<QuestionForm />} />

        <Route path="/quiz/:quizId/:moduleId/attempt" element={<QuizAttempt />} />

        <Route path="/user-progress/:courseId/:userId" element={<UserProgress />} />
        
        <Route path="/user-progress-page/:userId" element={<UserProgressPage />} />

        <Route path="/user-role-management" element={<UserRoleManagement />} />

        <Route path="/department-management-page" element={<DepartmentManagementPage />} />

        <Route path="/department-management" element={<ViewDepartment />} />

        <Route path="/create-department" element={<CreateDepartment />} />
        
        <Route path="/change-manager" element={<ChangeManager />} />
        
        <Route path="/change-participants" element={<ChangeParticipants />} />

        <Route path="/manager-performance-dashboard" element={<ManagerPerformanceDashboard />} />

        <Route path="/manager-participant-pie-chart" element={<ManagerParticipantPieChart />} />

        <Route path="/manager-filter-performance" element={<ManagerFilterPerformance />} />

        <Route path="/manager-leaderboard-page" element={<ManagerLeaderboardPage />} />


        <Route path="/hr-performance-dashboard" element={<HRPerformanceDashboard />} />

        <Route path="/hr-participant-pie-chart" element={<HRParticipantPieChart />} />

        <Route path="/hr-filter-performance" element={<HRFilterPerformance />} />

        <Route path="/hr-leaderboard-page" element={<HRLeaderboardPage />} />

        <Route path="/hr-course-review" element={<HRCourseReview />} />

      </Routes>
    </Router>
  );
};

export default App;