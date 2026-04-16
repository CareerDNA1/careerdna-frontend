import './styles/global.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

import Start from './pages/Start';
import SurveyIntro from './pages/SurveyIntro';
import SurveyInstructions from './pages/SurveyInstructions';
import SurveyQuestions from './pages/SurveyQuestions';
import ResultsPage from './pages/ResultsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import SavedResultPage from './pages/SavedResultPage';

import {
  RequireAuth,
  StartedGuard,
  IntroGuard,
  InstructionsGuard,
  ResultsGuard,
} from './pages/RouteGuards';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/start" element={<Start />} />
          <Route path="/app" element={<Navigate to="/start" replace />} />
          <Route path="/results/run/:runId" element={<SavedResultPage />} />

          <Route element={<StartedGuard />}>
            <Route path="/survey/intro" element={<SurveyIntro />} />
          </Route>

          <Route element={<IntroGuard />}>
            <Route path="/survey/instructions" element={<SurveyInstructions />} />
          </Route>

          <Route element={<InstructionsGuard />}>
            <Route path="/survey/questions" element={<SurveyQuestions />} />
          </Route>

          <Route element={<ResultsGuard />}>
            <Route path="/results" element={<ResultsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
